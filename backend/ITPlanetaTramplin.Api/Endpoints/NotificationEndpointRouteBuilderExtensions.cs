using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class NotificationEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapNotificationEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/notifications", GetCurrentUserNotificationsAsync).RequireAuthorization();
        api.MapPost("/notifications/{notificationId:int}/read", MarkNotificationReadAsync).RequireAuthorization();
        api.MapPost("/notifications/read-all", MarkAllNotificationsReadAsync).RequireAuthorization();

        return api;
    }

    public static UserNotification CreateNotification(
        ApplicationDBContext db,
        int userId,
        string type,
        string title,
        string? message = null,
        string? link = null,
        int? actorUserId = null,
        int? opportunityId = null,
        int? applicationId = null,
        int? complaintId = null)
    {
        var notification = new UserNotification
        {
            UserId = userId,
            Type = string.IsNullOrWhiteSpace(type) ? "general" : type.Trim(),
            Title = title.Trim(),
            Message = string.IsNullOrWhiteSpace(message) ? null : message.Trim(),
            Link = string.IsNullOrWhiteSpace(link) ? null : link.Trim(),
            ActorUserId = actorUserId,
            OpportunityId = opportunityId,
            ApplicationId = applicationId,
            ComplaintId = complaintId,
            IsRead = false,
        };

        db.UserNotifications.Add(notification);
        return notification;
    }

    private static async Task<IResult> GetCurrentUserNotificationsAsync(HttpContext context, ApplicationDBContext db, bool unreadOnly = false)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var query = db.UserNotifications
            .Where(item => item.UserId == userId.Value);

        if (unreadOnly)
        {
            query = query.Where(item => !item.IsRead);
        }

        var notifications = await query
            .OrderByDescending(item => item.CreatedAt)
            .Take(50)
            .Select(item => new UserNotificationReadDTO
            {
                Id = item.Id,
                Type = item.Type,
                Title = item.Title,
                Message = item.Message,
                Link = item.Link,
                IsRead = item.IsRead,
                CreatedAt = item.CreatedAt,
                ReadAt = item.ReadAt,
                ActorUserId = item.ActorUserId,
                OpportunityId = item.OpportunityId,
                ApplicationId = item.ApplicationId,
                ComplaintId = item.ComplaintId,
            })
            .ToListAsync();

        return Results.Ok(notifications);
    }

    private static async Task<IResult> MarkNotificationReadAsync(int notificationId, HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var notification = await db.UserNotifications.FirstOrDefaultAsync(item => item.Id == notificationId && item.UserId == userId.Value);
        if (notification is null)
        {
            return Results.NotFound();
        }

        notification.IsRead = true;
        notification.ReadAt ??= DateTime.UtcNow;
        await db.SaveChangesAsync();

        return Results.Ok(new { notification.Id, notification.IsRead, notification.ReadAt });
    }

    private static async Task<IResult> MarkAllNotificationsReadAsync(HttpContext context, ApplicationDBContext db)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var now = DateTime.UtcNow;
        var unreadNotifications = await db.UserNotifications
            .Where(item => item.UserId == userId.Value && !item.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
            notification.ReadAt ??= now;
        }

        await db.SaveChangesAsync();
        return Results.Ok(new { Updated = unreadNotifications.Count });
    }
}
