using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class ComplaintEndpointRouteBuilderExtensions
{
    private const string StatusPending = "pending";
    private const string StatusInReview = "in_review";
    private const string StatusUpheld = "upheld";
    private const string StatusDismissed = "dismissed";

    public static RouteGroupBuilder MapComplaintEndpoints(this RouteGroupBuilder api)
    {
        api.MapPost("/opportunities/{opportunityId:int}/complaints", CreateOpportunityComplaintAsync).RequireAuthorization();
        api.MapGet("/moderation/complaints", GetModerationComplaintsAsync).RequireAuthorization("requireModeratorRole");
        api.MapPost("/moderation/complaints/{complaintId:int}/decision", ApplyComplaintDecisionAsync).RequireAuthorization("requireModeratorRole");

        return api;
    }

    private static async Task<IResult> CreateOpportunityComplaintAsync(
        int opportunityId,
        [FromBody] ComplaintCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var reason = NormalizeReason(request.Reason);
        if (string.IsNullOrWhiteSpace(reason))
        {
            return AuthEndpointSupport.MessageResult("Укажите причину жалобы.", StatusCodes.Status400BadRequest);
        }

        if (!await SystemReferenceSupport.IsActiveValueAsync(db, SystemReferenceSupport.ComplaintReasonsCategory, reason))
        {
            return AuthEndpointSupport.MessageResult("Эта причина жалобы сейчас отключена.", StatusCodes.Status400BadRequest);
        }

        var opportunity = await db.Opportunities
            .Include(item => item.Employer)
            .FirstOrDefaultAsync(item => item.Id == opportunityId && item.DeletedAt == null);
        if (opportunity is null || OpportunityModerationStatuses.Normalize(opportunity.ModerationStatus) != OpportunityModerationStatuses.Approved)
        {
            return Results.NotFound();
        }

        var hasPendingComplaint = await db.Complaints.AnyAsync(item =>
            item.OpportunityId == opportunityId &&
            item.ReporterUserId == userId.Value &&
            (item.Status == StatusPending || item.Status == StatusInReview));
        if (hasPendingComplaint)
        {
            return Results.Conflict(new MessageResponseDTO { Message = "Вы уже отправили жалобу на эту возможность." });
        }

        var complaint = new Complaint
        {
            OpportunityId = opportunityId,
            ReporterUserId = userId.Value,
            Reason = reason,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            Status = StatusPending,
        };

        db.Complaints.Add(complaint);
        await db.SaveChangesAsync();

        var moderatorUserIds = await db.CuratorProfiles.Select(item => item.UserId).ToListAsync();
        foreach (var moderatorUserId in moderatorUserIds)
        {
            NotificationEndpointRouteBuilderExtensions.CreateNotification(
                db,
                moderatorUserId,
                "complaint.created",
                "Новая жалоба на возможность",
                $"{opportunity.Title}: {reason}",
                "/moderator/complaints",
                actorUserId: userId.Value,
                opportunityId: opportunity.Id,
                complaintId: complaint.Id);
        }

        if (moderatorUserIds.Count > 0)
        {
            await db.SaveChangesAsync();
        }

        return Results.Created($"/api/moderation/complaints/{complaint.Id}", MapComplaint(complaint, opportunity, reporterEmail: null, count: 1));
    }

    private static async Task<IResult> GetModerationComplaintsAsync(ApplicationDBContext db)
    {
        var groupedCounts = await db.Complaints
            .Where(item => item.Status == StatusPending || item.Status == StatusInReview)
            .GroupBy(item => new { item.OpportunityId, item.Reason })
            .Select(group => new
            {
                group.Key.OpportunityId,
                group.Key.Reason,
                Count = group.Count(),
            })
            .ToListAsync();

        var complaints = await db.Complaints
            .Where(item => item.Status == StatusPending || item.Status == StatusInReview)
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Employer)
            .Include(item => item.ReporterUser)
            .OrderByDescending(item => item.CreatedAt)
            .ToListAsync();

        var response = complaints.Select(item =>
        {
            var count = groupedCounts.FirstOrDefault(group =>
                group.OpportunityId == item.OpportunityId &&
                string.Equals(group.Reason, item.Reason, StringComparison.OrdinalIgnoreCase))?.Count ?? 1;

            return MapComplaint(item, item.Opportunity, item.ReporterUser.Email, count);
        }).ToList();

        return Results.Ok(response);
    }

    private static async Task<IResult> ApplyComplaintDecisionAsync(
        int complaintId,
        [FromBody] ComplaintDecisionDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var moderatorUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (moderatorUserId is null)
        {
            return Results.Unauthorized();
        }

        var complaint = await db.Complaints
            .Include(item => item.Opportunity)
            .ThenInclude(item => item.Employer)
            .Include(item => item.ReporterUser)
            .FirstOrDefaultAsync(item => item.Id == complaintId);
        if (complaint is null)
        {
            return Results.NotFound();
        }

        var action = NormalizeDecision(request.Status);
        if (action is null)
        {
            return AuthEndpointSupport.MessageResult("Укажите корректное действие по жалобе.", StatusCodes.Status400BadRequest);
        }

        var note = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();
        complaint.Status = action switch
        {
            "block" => StatusUpheld,
            "review" => StatusInReview,
            "dismiss" => StatusDismissed,
            _ => StatusPending,
        };
        complaint.ModeratorNote = note;
        complaint.ResolvedByUserId = moderatorUserId.Value;
        complaint.ResolvedAt = action == "review" ? null : DateTime.UtcNow;

        if (action == "block")
        {
            complaint.Opportunity.ModerationStatus = OpportunityModerationStatuses.Rejected;
            complaint.Opportunity.ModerationReason = note ?? "Публикация заблокирована по жалобе.";
        }
        else if (action == "review")
        {
            complaint.Opportunity.ModerationStatus = OpportunityModerationStatuses.Pending;
            complaint.Opportunity.ModerationReason = note ?? "Публикация отправлена на повторную проверку по жалобе.";
        }

        ModerationEndpointRouteBuilderExtensions.AddAuditLog(
            db,
            moderatorUserId.Value,
            "complaint.decision",
            "complaint",
            complaint.Id,
            $"Жалоба по возможности «{complaint.Opportunity.Title}» обработана: {complaint.Status}");

        NotificationEndpointRouteBuilderExtensions.CreateNotification(
            db,
            complaint.ReporterUserId,
            "complaint.updated",
            "Статус жалобы обновлен",
            BuildReporterMessage(complaint),
            $"/opportunities/{complaint.OpportunityId}",
            actorUserId: moderatorUserId.Value,
            opportunityId: complaint.OpportunityId,
            complaintId: complaint.Id);

        NotificationEndpointRouteBuilderExtensions.CreateNotification(
            db,
            complaint.Opportunity.Employer.UserId,
            "complaint.decision",
            "Решение по жалобе на вашу публикацию",
            BuildEmployerMessage(complaint),
            $"/opportunities/{complaint.OpportunityId}",
            actorUserId: moderatorUserId.Value,
            opportunityId: complaint.OpportunityId,
            complaintId: complaint.Id);

        await db.SaveChangesAsync();
        return Results.Ok(MapComplaint(complaint, complaint.Opportunity, complaint.ReporterUser.Email, 1));
    }

    private static string NormalizeReason(string? value) =>
        string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();

    private static string? NormalizeDecision(string? value)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim().ToLowerInvariant();
        return normalized switch
        {
            "block" or "upheld" or "reject" => "block",
            "review" or "in_review" or "pending" => "review",
            "dismiss" or "dismissed" or "approve" => "dismiss",
            _ => null,
        };
    }

    private static string BuildReporterMessage(Complaint complaint) =>
        complaint.Status switch
        {
            StatusUpheld => "Модератор подтвердил нарушение и ограничил публикацию.",
            StatusInReview => "Модератор отправил публикацию на дополнительную проверку.",
            StatusDismissed => "Модератор проверил жалобу и не нашел нарушения.",
            _ => "Жалоба находится в работе.",
        };

    private static string BuildEmployerMessage(Complaint complaint) =>
        complaint.Status switch
        {
            StatusUpheld => $"Публикация «{complaint.Opportunity.Title}» ограничена по жалобе.",
            StatusInReview => $"Публикация «{complaint.Opportunity.Title}» отправлена на повторную проверку.",
            StatusDismissed => $"Жалоба на публикацию «{complaint.Opportunity.Title}» снята.",
            _ => $"По публикации «{complaint.Opportunity.Title}» есть жалоба.",
        };

    private static ComplaintReadDTO MapComplaint(Complaint complaint, Opportunity opportunity, string? reporterEmail, int count) =>
        new()
        {
            Id = complaint.Id,
            OpportunityId = complaint.OpportunityId,
            OpportunityTitle = opportunity.Title,
            EmployerId = opportunity.EmployerId,
            CompanyName = opportunity.Employer.CompanyName,
            ReporterUserId = complaint.ReporterUserId,
            ReporterEmail = reporterEmail ?? string.Empty,
            Reason = complaint.Reason,
            Description = complaint.Description,
            Status = complaint.Status,
            ModeratorNote = complaint.ModeratorNote,
            Count = count,
            CreatedAt = complaint.CreatedAt,
            ResolvedAt = complaint.ResolvedAt,
        };
}
