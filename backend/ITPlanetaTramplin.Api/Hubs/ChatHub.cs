using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ITPlanetaTramplin.Api.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    private readonly ChatService _chatService;

    public ChatHub(ChatService chatService)
    {
        _chatService = chatService;
    }

    public static string UserGroup(int userId) => $"chat:user:{userId}";

    public static string ThreadGroup(int threadId) => $"chat:thread:{threadId}";

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId();
        if (userId is not null)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, UserGroup(userId.Value));
        }

        await base.OnConnectedAsync();
    }

    public async Task JoinThread(int threadId)
    {
        var userId = GetCurrentUserId();
        if (userId is null || !await _chatService.IsParticipantAsync(userId.Value, threadId))
        {
            throw new HubException("Chat thread was not found.");
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, ThreadGroup(threadId));
    }

    public Task LeaveThread(int threadId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, ThreadGroup(threadId));

    public async Task SendMessage(int threadId, string body)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            throw new HubException("Unauthorized.");
        }

        try
        {
            var result = await _chatService.CreateMessageAsync(userId.Value, threadId, body);
            await Clients.Group(ThreadGroup(threadId)).SendAsync("MessageCreated", result.Message);
            await BroadcastThreadAsync(result.Thread);
        }
        catch (ChatAccessException ex)
        {
            throw new HubException(ex.Message);
        }
    }

    public async Task MarkRead(int threadId)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            throw new HubException("Unauthorized.");
        }

        var readState = await _chatService.MarkReadAsync(userId.Value, threadId);
        if (readState is null)
        {
            throw new HubException("Chat thread was not found.");
        }

        await Clients.Group(ThreadGroup(threadId)).SendAsync("ReadStateUpdated", readState);
    }

    private Task BroadcastThreadAsync(DTO.ChatThreadReadDTO thread)
    {
        var tasks = thread.Participants
            .Select(participant => Clients.Group(UserGroup(participant.UserId)).SendAsync("ThreadUpdated", thread));

        return Task.WhenAll(tasks);
    }

    private int? GetCurrentUserId() => AuthEndpointSupport.GetCurrentUserId(Context.GetHttpContext()!);
}
