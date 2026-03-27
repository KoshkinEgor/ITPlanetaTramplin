using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static partial class CandidateEndpointRouteBuilderExtensions
{
    private static async Task<IResult> GetCandidatePublicProfileAsync(int userId, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var profile = await db.ApplicantProfiles
            .Include(item => item.User)
            .Include(item => item.ApplicantEducations)
            .FirstOrDefaultAsync(item => item.UserId == userId);

        if (profile is null)
        {
            return Results.NotFound();
        }

        var relationship = await BuildRelationshipSummaryAsync(db, currentUserId.Value, userId);
        var links = ParseJsonObject(profile.Links);
        var onboarding = GetObjectNode(links, "onboarding");
        var resumes = GetArrayNode(links, "resumes");
        var rawSocialLinks = ExtractVisibleSocialLinks(links);
        var projectsVisibility = GetNestedString(links, "preferences", "visibility", "projectsVisibility");
        var contactsAudience = GetNestedString(links, "preferences", "audience", "contactsAudience");
        var canSeeProjects = CanAccessScope(projectsVisibility, relationship, currentUserId.Value == userId);
        var canSeeContacts = CanAccessScope(contactsAudience, relationship, currentUserId.Value == userId);
        var visibleSocialLinks = canSeeContacts ? rawSocialLinks : null;
        var visibleResumes = ExtractVisibleResumes(resumes, relationship, currentUserId.Value == userId);
        var totalPortfolioProjects = await db.CandidateProjects.CountAsync(item => item.ApplicantId == profile.Id && item.ShowInPortfolio);
        var visibleProjects = canSeeProjects
            ? await db.CandidateProjects
                .Where(item => item.ApplicantId == profile.Id && item.ShowInPortfolio)
                .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
                .Select(item => (object)MapCandidateProject(item))
                .ToListAsync()
            : [];

        var result = new CandidatePublicProfileReadDTO
        {
            UserId = profile.UserId,
            ProfileId = profile.Id,
            Name = profile.Name,
            Surname = profile.Surname,
            Thirdname = profile.Thirdname,
            Description = profile.Description,
            Skills = profile.Skills,
            Links = BuildPublicLinksPayload(onboarding, visibleResumes),
            SocialLinks = visibleSocialLinks,
            Education = BuildPublicEducationPayload(profile, onboarding),
            HasProjects = totalPortfolioProjects > 0,
            HasResumes = (resumes?.Count ?? 0) > 0,
            HasSocialLinks = HasAnySocialLinks(rawSocialLinks),
            CanSeeProjects = canSeeProjects,
            CanSeeSocialLinks = canSeeContacts,
            Projects = visibleProjects,
            Resumes = visibleResumes,
            Relationship = relationship,
        };

        return Results.Ok(result);
    }

    private static async Task<IResult> GetCurrentCandidateFriendsAsync(HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var acceptedRequests = await db.FriendRequests
            .AsNoTracking()
            .Where(item =>
                (item.SenderUserId == currentUserId.Value || item.RecipientUserId == currentUserId.Value)
                && item.Status == FriendRequestStatuses.Accepted)
            .OrderByDescending(item => item.RespondedAt ?? item.UpdatedAt ?? item.CreatedAt)
            .ToListAsync();

        var userIds = acceptedRequests
            .Select(item => item.SenderUserId == currentUserId.Value ? item.RecipientUserId : item.SenderUserId)
            .Distinct()
            .ToList();

        var friends = new List<SocialUserSummaryDTO>();
        foreach (var userId in userIds)
        {
            friends.Add(await GetSocialUserSummaryAsync(db, currentUserId.Value, userId));
        }

        return Results.Ok(friends);
    }

    private static async Task<IResult> GetCurrentCandidateFriendRequestsAsync(HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var requests = await db.FriendRequests
            .AsNoTracking()
            .Where(item => item.SenderUserId == currentUserId.Value || item.RecipientUserId == currentUserId.Value)
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ToListAsync();

        var result = new List<FriendRequestReadDTO>();
        foreach (var request in requests)
        {
            result.Add(await MapFriendRequestAsync(db, currentUserId.Value, request));
        }

        return Results.Ok(result);
    }

    private static async Task<IResult> CreateFriendRequestAsync([FromBody] FriendRequestCreateDTO request, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (currentUserId.Value == request.UserId)
        {
            return AuthEndpointSupport.MessageResult("Нельзя отправить заявку самому себе.", StatusCodes.Status400BadRequest);
        }

        var recipientExists = await db.ApplicantProfiles.AnyAsync(item => item.UserId == request.UserId);
        if (!recipientExists)
        {
            return Results.NotFound();
        }

        var relationship = await BuildRelationshipSummaryAsync(db, currentUserId.Value, request.UserId);
        if (relationship.FriendState == "friends")
        {
            return AuthEndpointSupport.MessageResult("Пользователь уже находится у вас в друзьях.", StatusCodes.Status409Conflict);
        }

        var existingPending = await db.FriendRequests.FirstOrDefaultAsync(item =>
            ((item.SenderUserId == currentUserId.Value && item.RecipientUserId == request.UserId)
             || (item.SenderUserId == request.UserId && item.RecipientUserId == currentUserId.Value))
            && item.Status == FriendRequestStatuses.Pending);

        if (existingPending is not null)
        {
            return Results.Ok(await MapFriendRequestAsync(db, currentUserId.Value, existingPending));
        }

        var friendRequest = new FriendRequest
        {
            SenderUserId = currentUserId.Value,
            RecipientUserId = request.UserId,
            Status = FriendRequestStatuses.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.FriendRequests.Add(friendRequest);
        await db.SaveChangesAsync();

        return Results.Ok(await MapFriendRequestAsync(db, currentUserId.Value, friendRequest));
    }

    private static Task<IResult> AcceptFriendRequestAsync(int requestId, HttpContext context, ApplicationDBContext db) =>
        UpdateFriendRequestStatusAsync(requestId, FriendRequestStatuses.Accepted, context, db);

    private static Task<IResult> DeclineFriendRequestAsync(int requestId, HttpContext context, ApplicationDBContext db) =>
        UpdateFriendRequestStatusAsync(requestId, FriendRequestStatuses.Declined, context, db);

    private static Task<IResult> CancelFriendRequestAsync(int requestId, HttpContext context, ApplicationDBContext db) =>
        UpdateFriendRequestStatusAsync(requestId, FriendRequestStatuses.Canceled, context, db);

    private static async Task<IResult> DeleteCurrentCandidateFriendAsync(int userId, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (currentUserId.Value == userId)
        {
            return AuthEndpointSupport.MessageResult("Нельзя удалить из друзей самого себя.", StatusCodes.Status400BadRequest);
        }

        var acceptedRequests = await db.FriendRequests
            .Where(item =>
                ((item.SenderUserId == currentUserId.Value && item.RecipientUserId == userId)
                 || (item.SenderUserId == userId && item.RecipientUserId == currentUserId.Value))
                && item.Status == FriendRequestStatuses.Accepted)
            .ToListAsync();

        if (acceptedRequests.Count == 0)
        {
            return Results.NotFound();
        }

        db.FriendRequests.RemoveRange(acceptedRequests);
        await db.SaveChangesAsync();

        return Results.Ok();
    }

    private static async Task<IResult> GetCurrentCandidateProjectInvitesAsync(HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var invites = await db.CandidateProjectInvites
            .AsNoTracking()
            .Include(item => item.Project)
            .Where(item => item.SenderUserId == currentUserId.Value || item.RecipientUserId == currentUserId.Value)
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ToListAsync();

        var result = new List<CandidateProjectInviteReadDTO>();
        foreach (var invite in invites)
        {
            result.Add(await MapProjectInviteAsync(db, currentUserId.Value, invite));
        }

        return Results.Ok(result);
    }

    private static async Task<IResult> CreateCandidateProjectInviteAsync(
        [FromBody] CandidateProjectInviteCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (currentUserId.Value == request.RecipientUserId)
        {
            return AuthEndpointSupport.MessageResult("Нельзя пригласить в проект самого себя.", StatusCodes.Status400BadRequest);
        }

        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var project = await db.CandidateProjects.FirstOrDefaultAsync(item => item.Id == request.ProjectId && item.ApplicantId == profile.Id);
        if (project is null)
        {
            return Results.NotFound();
        }

        var recipient = await db.ApplicantProfiles.FirstOrDefaultAsync(item => item.UserId == request.RecipientUserId);
        if (recipient is null)
        {
            return Results.NotFound();
        }

        var relationship = await BuildRelationshipSummaryAsync(db, currentUserId.Value, request.RecipientUserId);
        if (relationship.ContactState != "saved" && relationship.FriendState != "friends")
        {
            return AuthEndpointSupport.MessageResult("Приглашать в проект можно только контактов и друзей.", StatusCodes.Status400BadRequest);
        }

        var existingPendingInvite = await db.CandidateProjectInvites
            .Include(item => item.Project)
            .FirstOrDefaultAsync(item =>
                item.ProjectId == request.ProjectId
                && item.SenderUserId == currentUserId.Value
                && item.RecipientUserId == request.RecipientUserId
                && item.Status == ProjectInviteStatuses.Pending);

        if (existingPendingInvite is not null)
        {
            return Results.Ok(await MapProjectInviteAsync(db, currentUserId.Value, existingPendingInvite));
        }

        var invite = new CandidateProjectInvite
        {
            SenderUserId = currentUserId.Value,
            RecipientUserId = request.RecipientUserId,
            ProjectId = request.ProjectId,
            Role = NormalizeOptionalText(request.Role),
            Message = NormalizeOptionalText(request.Message),
            Status = ProjectInviteStatuses.Pending,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        db.CandidateProjectInvites.Add(invite);
        await db.SaveChangesAsync();

        invite.Project = project;
        return Results.Ok(await MapProjectInviteAsync(db, currentUserId.Value, invite));
    }

    private static Task<IResult> AcceptCandidateProjectInviteAsync(int inviteId, HttpContext context, ApplicationDBContext db) =>
        UpdateProjectInviteStatusAsync(inviteId, ProjectInviteStatuses.Accepted, context, db);

    private static Task<IResult> DeclineCandidateProjectInviteAsync(int inviteId, HttpContext context, ApplicationDBContext db) =>
        UpdateProjectInviteStatusAsync(inviteId, ProjectInviteStatuses.Declined, context, db);

    private static Task<IResult> CancelCandidateProjectInviteAsync(int inviteId, HttpContext context, ApplicationDBContext db) =>
        UpdateProjectInviteStatusAsync(inviteId, ProjectInviteStatuses.Canceled, context, db);

    private static async Task<IResult> UpdateFriendRequestStatusAsync(int requestId, string nextStatus, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var request = await db.FriendRequests.FirstOrDefaultAsync(item => item.Id == requestId);
        if (request is null)
        {
            return Results.NotFound();
        }

        if (request.Status != FriendRequestStatuses.Pending)
        {
            return AuthEndpointSupport.MessageResult("Статус заявки уже изменён.", StatusCodes.Status400BadRequest);
        }

        var canAcceptOrDecline = request.RecipientUserId == currentUserId.Value && (nextStatus == FriendRequestStatuses.Accepted || nextStatus == FriendRequestStatuses.Declined);
        var canCancel = request.SenderUserId == currentUserId.Value && nextStatus == FriendRequestStatuses.Canceled;

        if (!canAcceptOrDecline && !canCancel)
        {
            return Results.Forbid();
        }

        request.Status = nextStatus;
        request.UpdatedAt = DateTime.UtcNow;
        request.RespondedAt = DateTime.UtcNow;

        if (nextStatus == FriendRequestStatuses.Accepted)
        {
            await EnsureContactExistsAsync(db, request.SenderUserId, request.RecipientUserId);
            await EnsureContactExistsAsync(db, request.RecipientUserId, request.SenderUserId);
        }

        await db.SaveChangesAsync();
        return Results.Ok(await MapFriendRequestAsync(db, currentUserId.Value, request));
    }

    private static async Task<IResult> UpdateProjectInviteStatusAsync(int inviteId, string nextStatus, HttpContext context, ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var invite = await db.CandidateProjectInvites
            .Include(item => item.Project)
            .FirstOrDefaultAsync(item => item.Id == inviteId);

        if (invite is null)
        {
            return Results.NotFound();
        }

        if (invite.Status != ProjectInviteStatuses.Pending)
        {
            return AuthEndpointSupport.MessageResult("Статус приглашения уже изменён.", StatusCodes.Status400BadRequest);
        }

        var canAcceptOrDecline = invite.RecipientUserId == currentUserId.Value && (nextStatus == ProjectInviteStatuses.Accepted || nextStatus == ProjectInviteStatuses.Declined);
        var canCancel = invite.SenderUserId == currentUserId.Value && nextStatus == ProjectInviteStatuses.Canceled;

        if (!canAcceptOrDecline && !canCancel)
        {
            return Results.Forbid();
        }

        invite.Status = nextStatus;
        invite.UpdatedAt = DateTime.UtcNow;
        invite.RespondedAt = DateTime.UtcNow;

        if (nextStatus == ProjectInviteStatuses.Accepted)
        {
            var recipientProfile = await db.ApplicantProfiles.FirstOrDefaultAsync(item => item.UserId == invite.RecipientUserId);
            if (recipientProfile is not null)
            {
                AddParticipantToProject(invite.Project, recipientProfile, invite.Role);
            }
        }

        await db.SaveChangesAsync();
        return Results.Ok(await MapProjectInviteAsync(db, currentUserId.Value, invite));
    }

    private static void AddParticipantToProject(CandidateProject project, ApplicantProfile profile, string? role)
    {
        var participants = ParseCandidateProjectParticipants(project.ParticipantsJson);
        var displayName = string.Join(" ", new[] { profile.Name, profile.Surname, profile.Thirdname }
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!.Trim()));

        if (participants.Any(item => string.Equals(item.Name?.Trim(), displayName, StringComparison.OrdinalIgnoreCase)))
        {
            return;
        }

        participants.Add(new CandidateProjectParticipantDTO
        {
            Name = displayName,
            Role = NormalizeOptionalText(role),
        });

        project.ParticipantsJson = JsonSerializer.Serialize(participants);
        project.UpdatedAt = DateTime.UtcNow;
    }

    private static async Task EnsureContactExistsAsync(ApplicationDBContext db, int userId, int contactUserId)
    {
        var exists = await db.Contacts.AnyAsync(item => item.UserId == userId && item.ContactProfileId == contactUserId);
        if (exists)
        {
            return;
        }

        var owner = await db.Users.FirstOrDefaultAsync(item => item.Id == userId);
        var contact = await db.Users.FirstOrDefaultAsync(item => item.Id == contactUserId);
        if (owner is null || contact is null)
        {
            return;
        }

        db.Contacts.Add(new Contact
        {
            User = owner,
            ContactProfile = contact,
            CreatedAt = DateTime.UtcNow,
        });
    }

    private static async Task<FriendRequestReadDTO> MapFriendRequestAsync(ApplicationDBContext db, int currentUserId, FriendRequest request)
    {
        var counterpartyUserId = request.SenderUserId == currentUserId ? request.RecipientUserId : request.SenderUserId;

        return new FriendRequestReadDTO
        {
            Id = request.Id,
            SenderUserId = request.SenderUserId,
            RecipientUserId = request.RecipientUserId,
            Status = request.Status,
            CreatedAt = request.CreatedAt,
            UpdatedAt = request.UpdatedAt,
            RespondedAt = request.RespondedAt,
            Counterparty = await GetSocialUserSummaryAsync(db, currentUserId, counterpartyUserId),
        };
    }

    private static async Task<CandidateProjectInviteReadDTO> MapProjectInviteAsync(ApplicationDBContext db, int currentUserId, CandidateProjectInvite invite)
    {
        var counterpartyUserId = invite.SenderUserId == currentUserId ? invite.RecipientUserId : invite.SenderUserId;

        return new CandidateProjectInviteReadDTO
        {
            Id = invite.Id,
            SenderUserId = invite.SenderUserId,
            RecipientUserId = invite.RecipientUserId,
            ProjectId = invite.ProjectId,
            ProjectTitle = invite.Project?.Title,
            Role = invite.Role,
            Message = invite.Message,
            Status = invite.Status,
            CreatedAt = invite.CreatedAt,
            UpdatedAt = invite.UpdatedAt,
            RespondedAt = invite.RespondedAt,
            Counterparty = await GetSocialUserSummaryAsync(db, currentUserId, counterpartyUserId),
        };
    }

    private static async Task<SocialUserSummaryDTO> GetSocialUserSummaryAsync(ApplicationDBContext db, int currentUserId, int targetUserId)
    {
        var user = await db.Users
            .Include(item => item.ApplicantProfile)
            .FirstOrDefaultAsync(item => item.Id == targetUserId);

        if (user is null)
        {
            return new SocialUserSummaryDTO
            {
                UserId = targetUserId,
                Email = string.Empty,
                Name = "Пользователь",
                Skills = [],
                Relationship = new RelationshipSummaryDTO(),
            };
        }

        return new SocialUserSummaryDTO
        {
            UserId = user.Id,
            Email = user.Email,
            Name = AuthEndpointSupport.BuildDisplayName(user, PublicRoles.Candidate) ?? user.Email,
            Skills = user.ApplicantProfile?.Skills,
            Relationship = await BuildRelationshipSummaryAsync(db, currentUserId, targetUserId),
        };
    }

    private static async Task<RelationshipSummaryDTO> BuildRelationshipSummaryAsync(ApplicationDBContext db, int currentUserId, int targetUserId)
    {
        if (currentUserId == targetUserId)
        {
            return new RelationshipSummaryDTO
            {
                ContactState = "saved",
                FriendState = "friends",
                ProjectInviteState = "none",
                CanInviteToProject = false,
            };
        }

        var hasContact = await db.Contacts.AnyAsync(item => item.UserId == currentUserId && item.ContactProfileId == targetUserId);

        var latestFriendRequest = await db.FriendRequests
            .Where(item =>
                (item.SenderUserId == currentUserId && item.RecipientUserId == targetUserId)
                || (item.SenderUserId == targetUserId && item.RecipientUserId == currentUserId))
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .FirstOrDefaultAsync();

        var latestProjectInvite = await db.CandidateProjectInvites
            .Where(item =>
                (item.SenderUserId == currentUserId && item.RecipientUserId == targetUserId)
                || (item.SenderUserId == targetUserId && item.RecipientUserId == currentUserId))
            .OrderByDescending(item => item.UpdatedAt ?? item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .FirstOrDefaultAsync();

        var friendState = "none";
        if (latestFriendRequest is not null)
        {
            if (latestFriendRequest.Status == FriendRequestStatuses.Accepted)
            {
                friendState = "friends";
            }
            else if (latestFriendRequest.Status == FriendRequestStatuses.Pending)
            {
                friendState = latestFriendRequest.SenderUserId == currentUserId ? "outgoing" : "incoming";
            }
        }

        var projectInviteState = "none";
        if (latestProjectInvite is not null)
        {
            if (latestProjectInvite.Status == ProjectInviteStatuses.Pending)
            {
                projectInviteState = latestProjectInvite.SenderUserId == currentUserId ? "outgoing" : "incoming";
            }
            else
            {
                projectInviteState = latestProjectInvite.Status;
            }
        }

        return new RelationshipSummaryDTO
        {
            ContactState = hasContact ? "saved" : "none",
            FriendState = friendState,
            ProjectInviteState = projectInviteState,
            FriendRequestId = latestFriendRequest?.Status == FriendRequestStatuses.Pending ? latestFriendRequest.Id : null,
            ProjectInviteId = latestProjectInvite?.Status == ProjectInviteStatuses.Pending ? latestProjectInvite.Id : null,
            CanInviteToProject = hasContact || friendState == "friends",
        };
    }

    private static JsonObject ParseJsonObject(string? rawValue)
    {
        if (string.IsNullOrWhiteSpace(rawValue))
        {
            return new JsonObject();
        }

        try
        {
            return JsonNode.Parse(rawValue)?.AsObject() ?? new JsonObject();
        }
        catch
        {
            return new JsonObject();
        }
    }

    private static JsonObject? GetObjectNode(JsonObject source, string key)
    {
        return source[key] as JsonObject;
    }

    private static JsonArray? GetArrayNode(JsonObject source, string key)
    {
        return source[key] as JsonArray;
    }

    private static string? GetNestedString(JsonObject source, string objectKey, string nestedKey, string valueKey)
    {
        var root = GetObjectNode(source, objectKey);
        var nested = root?[nestedKey] as JsonObject;
        return nested?[valueKey]?.GetValue<string?>();
    }

    private static bool CanAccessScope(string? scope, RelationshipSummaryDTO relationship, bool isSelf)
    {
        if (isSelf)
        {
            return true;
        }

        return scope?.Trim().ToLowerInvariant() switch
        {
            "everyone" => true,
            "contacts" => relationship.ContactState == "saved" || relationship.FriendState == "friends",
            "employers-and-contacts" => relationship.ContactState == "saved" || relationship.FriendState == "friends",
            "employers" => false,
            "nobody" => false,
            "private" => false,
            null or "" => true,
            _ => false,
        };
    }

    private static object? ExtractVisibleSocialLinks(JsonObject links)
    {
        var contacts = GetObjectNode(links, "contacts");
        if (contacts is null)
        {
            return null;
        }

        return new
        {
            Vk = contacts["vk"]?.GetValue<string?>(),
            Telegram = contacts["telegram"]?.GetValue<string?>(),
            Behance = contacts["behance"]?.GetValue<string?>(),
            Portfolio = contacts["portfolio"]?.GetValue<string?>(),
            Github = contacts["github"]?.GetValue<string?>(),
        };
    }

    private static bool HasAnySocialLinks(object? socialLinks)
    {
        if (socialLinks is null)
        {
            return false;
        }

        foreach (var property in socialLinks.GetType().GetProperties())
        {
            if (property.GetValue(socialLinks) is string value && !string.IsNullOrWhiteSpace(value))
            {
                return true;
            }
        }

        return false;
    }

    private static List<object> ExtractVisibleResumes(JsonArray? resumes, RelationshipSummaryDTO relationship, bool isSelf)
    {
        if (resumes is null)
        {
            return [];
        }

        var visible = new List<object>();
        foreach (var node in resumes)
        {
            if (node is not JsonObject resume)
            {
                continue;
            }

            var visibility = resume["visibility"]?.GetValue<string?>();
            if (!CanAccessScope(visibility, relationship, isSelf))
            {
                continue;
            }

            visible.Add(JsonSerializer.Deserialize<object>(resume.ToJsonString())!);
        }

        return visible;
    }

    private static object? BuildPublicLinksPayload(JsonObject? onboarding, List<object> resumes)
    {
        return new
        {
            onboarding = onboarding is null ? null : JsonSerializer.Deserialize<object>(onboarding.ToJsonString()),
            resumes,
        };
    }

    private static object? BuildPublicEducationPayload(ApplicantProfile profile, JsonObject? onboarding)
    {
        var currentEducation = profile.ApplicantEducations
            .OrderByDescending(item => item.GraduationYear ?? item.StartYear ?? 0)
            .Select(item => new
            {
                item.Id,
                item.InstitutionName,
                item.Specialization,
                item.Faculty,
                item.StartYear,
                item.GraduationYear,
                item.IsCompleted,
            })
            .FirstOrDefault();

        if (currentEducation is not null)
        {
            return currentEducation;
        }

        if (onboarding?["education"] is JsonObject education)
        {
            return JsonSerializer.Deserialize<object>(education.ToJsonString());
        }

        return null;
    }
}
