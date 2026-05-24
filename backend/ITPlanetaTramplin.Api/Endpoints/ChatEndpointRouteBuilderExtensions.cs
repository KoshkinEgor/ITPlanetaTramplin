using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Hubs;
using ITPlanetaTramplin.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class ChatEndpointRouteBuilderExtensions
{
    public static RouteGroupBuilder MapChatEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/chats", GetCurrentUserThreadsAsync).RequireAuthorization();
        api.MapPost("/chats/start", StartThreadAsync).RequireAuthorization();
        api.MapGet("/chats/{threadId:int}", GetThreadAsync).RequireAuthorization();
        api.MapGet("/chats/{threadId:int}/messages", GetMessagesAsync).RequireAuthorization();
        api.MapPost("/chats/{threadId:int}/messages", CreateMessageAsync).RequireAuthorization();
        api.MapPost("/chats/{threadId:int}/read", MarkReadAsync).RequireAuthorization();

        return api;
    }

    private static async Task<IResult> GetCurrentUserThreadsAsync(HttpContext context, ChatService chatService)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        return userId is null
            ? Results.Unauthorized()
            : Results.Ok(await chatService.GetThreadsAsync(userId.Value));
    }

    private static async Task<IResult> StartThreadAsync(
        [FromBody] ChatStartDTO request,
        HttpContext context,
        ChatService chatService,
        IHubContext<ChatHub> hubContext)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        try
        {
            var thread = await chatService.StartThreadAsync(userId.Value, request);
            await BroadcastThreadAsync(hubContext, thread);
            return Results.Ok(thread);
        }
        catch (ChatAccessException ex)
        {
            return AuthEndpointSupport.MessageResult(ex.Message, ex.StatusCode);
        }
    }

    private static async Task<IResult> GetThreadAsync(int threadId, HttpContext context, ChatService chatService)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var thread = await chatService.GetThreadAsync(userId.Value, threadId);
        return thread is null ? Results.NotFound() : Results.Ok(thread);
    }

    private static async Task<IResult> GetMessagesAsync(
        int threadId,
        [FromQuery] int? take,
        HttpContext context,
        ChatService chatService)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var messages = await chatService.GetMessagesAsync(userId.Value, threadId, take ?? 80);
        return messages is null ? Results.NotFound() : Results.Ok(messages);
    }

    private static async Task<IResult> CreateMessageAsync(
        int threadId,
        [FromBody] ChatMessageCreateDTO request,
        HttpContext context,
        ChatService chatService,
        IHubContext<ChatHub> hubContext)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        try
        {
            var result = await chatService.CreateMessageAsync(userId.Value, threadId, request.Body);
            await hubContext.Clients.Group(ChatHub.ThreadGroup(threadId)).SendAsync("MessageCreated", result.Message);
            await BroadcastThreadAsync(hubContext, result.Thread);
            return Results.Ok(result);
        }
        catch (ChatAccessException ex)
        {
            return AuthEndpointSupport.MessageResult(ex.Message, ex.StatusCode);
        }
    }

    private static async Task<IResult> MarkReadAsync(
        int threadId,
        HttpContext context,
        ChatService chatService,
        IHubContext<ChatHub> hubContext)
    {
        var userId = AuthEndpointSupport.GetCurrentUserId(context);
        if (userId is null)
        {
            return Results.Unauthorized();
        }

        var readState = await chatService.MarkReadAsync(userId.Value, threadId);
        if (readState is null)
        {
            return Results.NotFound();
        }

        await hubContext.Clients.Group(ChatHub.ThreadGroup(threadId)).SendAsync("ReadStateUpdated", readState);
        return Results.Ok(readState);
    }

    private static Task BroadcastThreadAsync(IHubContext<ChatHub> hubContext, ChatThreadReadDTO thread)
    {
        var tasks = thread.Participants
            .Select(participant => hubContext.Clients.Group(ChatHub.UserGroup(participant.UserId)).SendAsync("ThreadUpdated", thread));

        return Task.WhenAll(tasks);
    }
}
