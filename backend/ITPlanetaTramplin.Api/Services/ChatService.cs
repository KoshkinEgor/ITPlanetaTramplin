using System.Text.Json;
using System.Text.Json.Nodes;
using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using ITPlanetaTramplin.Api.Endpoints;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Services;

public sealed class ChatService
{
    private const int MaxMessageLength = 4000;
    private readonly ApplicationDBContext _db;

    public ChatService(ApplicationDBContext db)
    {
        _db = db;
    }

    public async Task<List<ChatThreadReadDTO>> GetThreadsAsync(int currentUserId)
    {
        var threads = await LoadThreadQuery()
            .Where(item => item.Participants.Any(participant => participant.UserId == currentUserId))
            .OrderByDescending(item => item.LastMessageAt)
            .ThenByDescending(item => item.Id)
            .Take(100)
            .ToListAsync();

        return threads.Select(item => MapThread(item, currentUserId)).ToList();
    }

    public async Task<ChatThreadReadDTO?> GetThreadAsync(int currentUserId, int threadId)
    {
        var thread = await LoadThreadQuery()
            .FirstOrDefaultAsync(item => item.Id == threadId && item.Participants.Any(participant => participant.UserId == currentUserId));

        return thread is null ? null : MapThread(thread, currentUserId);
    }

    public async Task<List<ChatMessageReadDTO>?> GetMessagesAsync(int currentUserId, int threadId, int take = 80)
    {
        var isParticipant = await IsParticipantAsync(currentUserId, threadId);
        if (!isParticipant)
        {
            return null;
        }

        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.ApplicantProfile)
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.EmployerProfile)
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.CuratorProfile)
            .Where(item => item.ThreadId == threadId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .Take(Math.Clamp(take, 1, 150))
            .ToListAsync();

        messages.Reverse();
        return messages.Select(MapMessage).ToList();
    }

    public async Task<ChatThreadReadDTO> StartThreadAsync(int currentUserId, ChatStartDTO request)
    {
        var currentUser = await LoadUserAsync(currentUserId) ?? throw new ChatAccessException("Current user was not found.");
        var recipient = await LoadUserAsync(request.RecipientUserId) ?? throw new ChatAccessException("Recipient was not found.", StatusCodes.Status404NotFound);

        if (currentUser.Id == recipient.Id)
        {
            throw new ChatAccessException("Cannot create a chat with yourself.", StatusCodes.Status400BadRequest);
        }

        var contextType = ChatContextTypes.Normalize(request.ContextType);
        await EnsureCanStartThreadAsync(currentUser, recipient, contextType, request.ContextId);

        var existing = await FindExistingThreadAsync(currentUser, recipient, contextType, request.ContextId);
        if (existing is not null)
        {
            if (!string.IsNullOrWhiteSpace(request.InitialMessage))
            {
                await CreateMessageAsync(currentUser.Id, existing.Id, request.InitialMessage);
                existing = await LoadThreadAsync(existing.Id) ?? existing;
            }

            return MapThread(existing, currentUser.Id);
        }

        var now = DateTime.UtcNow;
        var thread = new ChatThread
        {
            Subject = NormalizeSubject(request.Subject, currentUser, recipient),
            ContextType = contextType,
            ContextId = request.ContextId,
            CreatedByUserId = currentUser.Id,
            CreatedAt = now,
            UpdatedAt = now,
            LastMessageAt = now,
            Participants =
            {
                BuildParticipant(currentUser, now),
                BuildParticipant(recipient, now),
            },
        };

        _db.ChatThreads.Add(thread);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(request.InitialMessage))
        {
            await CreateMessageAsync(currentUser.Id, thread.Id, request.InitialMessage);
        }

        var loaded = await LoadThreadAsync(thread.Id) ?? thread;
        return MapThread(loaded, currentUser.Id);
    }

    public async Task<ChatSendResultDTO> CreateMessageAsync(int currentUserId, int threadId, string? body)
    {
        var normalizedBody = NormalizeMessageBody(body);
        var thread = await LoadThreadForUpdateAsync(threadId);
        if (thread is null || thread.Participants.All(item => item.UserId != currentUserId))
        {
            throw new ChatAccessException("Chat thread was not found.", StatusCodes.Status404NotFound);
        }

        var now = DateTime.UtcNow;
        var message = new ChatMessage
        {
            ThreadId = thread.Id,
            SenderUserId = currentUserId,
            Body = normalizedBody,
            CreatedAt = now,
            IsSystem = false,
        };

        _db.ChatMessages.Add(message);
        thread.UpdatedAt = now;
        thread.LastMessageAt = now;

        var sender = thread.Participants.First(item => item.UserId == currentUserId);
        sender.LastReadAt = now;

        foreach (var recipient in thread.Participants.Where(item => item.UserId != currentUserId))
        {
            NotificationEndpointRouteBuilderExtensions.CreateNotification(
                _db,
                recipient.UserId,
                "chat.message",
                "Новое сообщение",
                normalizedBody.Length > 120 ? $"{normalizedBody[..120]}..." : normalizedBody,
                BuildThreadLink(recipient.Role, thread.Id),
                actorUserId: currentUserId);
        }

        await _db.SaveChangesAsync();

        var loadedThread = await LoadThreadAsync(thread.Id) ?? thread;
        var loadedMessage = await _db.ChatMessages
            .AsNoTracking()
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.ApplicantProfile)
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.EmployerProfile)
            .Include(item => item.SenderUser)
                .ThenInclude(item => item.CuratorProfile)
            .FirstAsync(item => item.Id == message.Id);

        return new ChatSendResultDTO
        {
            Thread = MapThread(loadedThread, currentUserId),
            Message = MapMessage(loadedMessage),
        };
    }

    public async Task<ChatReadStateDTO?> MarkReadAsync(int currentUserId, int threadId)
    {
        var participant = await _db.ChatParticipants.FirstOrDefaultAsync(item => item.ThreadId == threadId && item.UserId == currentUserId);
        if (participant is null)
        {
            return null;
        }

        participant.LastReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return new ChatReadStateDTO
        {
            ThreadId = threadId,
            UserId = currentUserId,
            LastReadAt = participant.LastReadAt.Value,
        };
    }

    public async Task<bool> IsParticipantAsync(int currentUserId, int threadId) =>
        await _db.ChatParticipants.AnyAsync(item => item.ThreadId == threadId && item.UserId == currentUserId);

    public async Task<ChatThreadReadDTO?> MapThreadForUserAsync(int threadId, int userId)
    {
        var thread = await LoadThreadAsync(threadId);
        return thread is null ? null : MapThread(thread, userId);
    }

    private IQueryable<ChatThread> LoadThreadQuery() =>
        _db.ChatThreads
            .AsSplitQuery()
            .Include(item => item.Participants)
                .ThenInclude(item => item.User)
                    .ThenInclude(item => item.ApplicantProfile)
            .Include(item => item.Participants)
                .ThenInclude(item => item.User)
                    .ThenInclude(item => item.EmployerProfile)
            .Include(item => item.Participants)
                .ThenInclude(item => item.User)
                    .ThenInclude(item => item.CuratorProfile)
            .Include(item => item.Messages)
                .ThenInclude(item => item.SenderUser)
                    .ThenInclude(item => item.ApplicantProfile)
            .Include(item => item.Messages)
                .ThenInclude(item => item.SenderUser)
                    .ThenInclude(item => item.EmployerProfile)
            .Include(item => item.Messages)
                .ThenInclude(item => item.SenderUser)
                    .ThenInclude(item => item.CuratorProfile);

    private async Task<User?> LoadUserAsync(int userId) =>
        await _db.Users
            .Include(item => item.ApplicantProfile)
            .Include(item => item.EmployerProfile)
                .ThenInclude(item => item!.Settings)
            .Include(item => item.CuratorProfile)
            .FirstOrDefaultAsync(item => item.Id == userId);

    private async Task<ChatThread?> LoadThreadAsync(int threadId) =>
        await LoadThreadQuery().FirstOrDefaultAsync(item => item.Id == threadId);

    private async Task<ChatThread?> LoadThreadForUpdateAsync(int threadId) =>
        await _db.ChatThreads
            .Include(item => item.Participants)
            .FirstOrDefaultAsync(item => item.Id == threadId);

    private async Task<ChatThread?> FindExistingThreadAsync(User firstUser, User secondUser, string contextType, int? contextId)
    {
        var firstUserId = firstUser.Id;
        var secondUserId = secondUser.Id;
        var exactMatch = await LoadThreadQuery()
            .Where(item => item.ContextType == contextType && item.ContextId == contextId)
            .Where(item => item.Participants.Count == 2)
            .Where(item => item.Participants.Any(participant => participant.UserId == firstUserId))
            .Where(item => item.Participants.Any(participant => participant.UserId == secondUserId))
            .FirstOrDefaultAsync();

        if (exactMatch is not null)
        {
            return exactMatch;
        }

        var firstRole = AuthEndpointSupport.GetPublicRole(firstUser);
        var secondRole = AuthEndpointSupport.GetPublicRole(secondUser);
        if (firstRole is not null && secondRole is not null && IsCandidateCompanyPair(firstRole, secondRole))
        {
            var candidateCompanyMatch = await LoadThreadQuery()
                .Where(item => item.Participants.Count == 2)
                .Where(item => item.Participants.Any(participant => participant.UserId == firstUserId))
                .Where(item => item.Participants.Any(participant => participant.UserId == secondUserId))
                .OrderByDescending(item => item.LastMessageAt)
                .ThenByDescending(item => item.Id)
                .FirstOrDefaultAsync();

            if (candidateCompanyMatch is not null)
            {
                if (candidateCompanyMatch.ContextType == ChatContextTypes.Direct && contextType != ChatContextTypes.Direct)
                {
                    candidateCompanyMatch.ContextType = contextType;
                    candidateCompanyMatch.ContextId = contextId;
                    _db.ChatThreads.Update(candidateCompanyMatch);
                    await _db.SaveChangesAsync();
                }

                return candidateCompanyMatch;
            }
        }

        return null;
    }

    private async Task EnsureCanStartThreadAsync(User currentUser, User recipient, string contextType, int? contextId)
    {
        var currentRole = AuthEndpointSupport.GetPublicRole(currentUser);
        var recipientRole = AuthEndpointSupport.GetPublicRole(recipient);
        if (currentRole is null || recipientRole is null)
        {
            throw new ChatAccessException("Chat is available only for platform users.", StatusCodes.Status403Forbidden);
        }

        if (currentRole == PublicRoles.Candidate && recipientRole == PublicRoles.Candidate)
        {
            if (await CanCandidateReceiveFromCandidateAsync(currentUser.Id, recipient))
            {
                return;
            }

            throw new ChatAccessException("This candidate does not accept messages from your relationship level.", StatusCodes.Status403Forbidden);
        }

        if (IsCandidateCompanyPair(currentRole, recipientRole))
        {
            var candidateUserId = currentRole == PublicRoles.Candidate ? currentUser.Id : recipient.Id;
            var companyUserId = currentRole == PublicRoles.Company ? currentUser.Id : recipient.Id;
            if (await HasCandidateCompanyContextAsync(candidateUserId, companyUserId, contextType, contextId))
            {
                return;
            }

            throw new ChatAccessException("Company chats with candidates are available after an application context exists.", StatusCodes.Status403Forbidden);
        }

        if (currentRole == PublicRoles.Company && recipientRole == PublicRoles.Company)
        {
            if (CanCompanyReceiveFromCompany(currentUser) && CanCompanyReceiveFromCompany(recipient))
            {
                return;
            }

            throw new ChatAccessException("Company-to-company chat requires both companies to enable incoming company messages.", StatusCodes.Status403Forbidden);
        }

        if (currentRole == PublicRoles.Moderator && recipientRole == PublicRoles.Company)
        {
            return;
        }

        throw new ChatAccessException("This chat direction is not allowed.", StatusCodes.Status403Forbidden);
    }

    private async Task<bool> CanCandidateReceiveFromCandidateAsync(int senderUserId, User recipient)
    {
        var scope = ChatPrivacyScopes.NormalizeCandidateIncoming(GetCandidateIncomingScope(recipient.ApplicantProfile?.Links));
        if (scope == ChatPrivacyScopes.Everyone)
        {
            return true;
        }

        if (scope == ChatPrivacyScopes.Nobody)
        {
            return false;
        }

        var areFriends = await _db.FriendRequests.AnyAsync(item =>
            ((item.SenderUserId == senderUserId && item.RecipientUserId == recipient.Id)
             || (item.SenderUserId == recipient.Id && item.RecipientUserId == senderUserId))
            && item.Status == FriendRequestStatuses.Accepted);

        if (scope == ChatPrivacyScopes.Friends)
        {
            return areFriends;
        }

        var recipientSavedSender = await _db.Contacts.AnyAsync(item => item.UserId == recipient.Id && item.ContactProfileId == senderUserId);
        return areFriends || recipientSavedSender;
    }

    private static string GetCandidateIncomingScope(string? rawLinks)
    {
        if (string.IsNullOrWhiteSpace(rawLinks))
        {
            return ChatPrivacyScopes.Everyone;
        }

        try
        {
            var links = JsonNode.Parse(rawLinks)?.AsObject();
            return links?["preferences"]?["chat"]?["incomingFromCandidates"]?.GetValue<string?>()
                ?? links?["preferences"]?["audience"]?["messagesAudience"]?.GetValue<string?>()
                ?? links?["preferences"]?["privacy"]?["messageAudience"]?.GetValue<string?>()
                ?? ChatPrivacyScopes.Everyone;
        }
        catch (JsonException)
        {
            return ChatPrivacyScopes.Everyone;
        }
    }

    private async Task<bool> HasCandidateCompanyContextAsync(int candidateUserId, int companyUserId, string contextType, int? contextId)
    {
        var query = _db.Applications
            .AsNoTracking()
            .Include(item => item.Applicant)
            .Include(item => item.Opportunity)
                .ThenInclude(item => item.Employer)
            .Where(item => item.Applicant.UserId == candidateUserId && item.Opportunity.Employer.UserId == companyUserId);

        if (contextType == ChatContextTypes.Application && contextId.HasValue)
        {
            query = query.Where(item => item.Id == contextId.Value);
        }
        else if (contextType == ChatContextTypes.Opportunity && contextId.HasValue)
        {
            query = query.Where(item => item.OpportunityId == contextId.Value);
        }

        return await query.AnyAsync();
    }

    private static bool CanCompanyReceiveFromCompany(User user) =>
        CompanyVerificationStatuses.Normalize(user.EmployerProfile?.VerificationStatus) == CompanyVerificationStatuses.Approved
        && user.EmployerProfile?.Settings?.AllowCompanyMessages == true;

    private static bool IsCandidateCompanyPair(string firstRole, string secondRole) =>
        (firstRole == PublicRoles.Candidate && secondRole == PublicRoles.Company)
        || (firstRole == PublicRoles.Company && secondRole == PublicRoles.Candidate);

    private static ChatParticipant BuildParticipant(User user, DateTime now) =>
        new()
        {
            UserId = user.Id,
            Role = AuthEndpointSupport.GetPublicRole(user) ?? string.Empty,
            CreatedAt = now,
            LastReadAt = null,
            IsMuted = false,
        };

    private static string NormalizeSubject(string? subject, User currentUser, User recipient)
    {
        var normalized = subject?.Trim();
        if (!string.IsNullOrWhiteSpace(normalized))
        {
            return normalized.Length > 160 ? normalized[..160] : normalized;
        }

        var currentName = AuthEndpointSupport.BuildDisplayName(currentUser, AuthEndpointSupport.GetPublicRole(currentUser) ?? string.Empty)
            ?? currentUser.Email;
        var recipientName = AuthEndpointSupport.BuildDisplayName(recipient, AuthEndpointSupport.GetPublicRole(recipient) ?? string.Empty)
            ?? recipient.Email;

        return $"{currentName} - {recipientName}";
    }

    private static string NormalizeMessageBody(string? body)
    {
        var normalized = body?.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ChatAccessException("Message cannot be empty.", StatusCodes.Status400BadRequest);
        }

        if (normalized.Length > MaxMessageLength)
        {
            throw new ChatAccessException($"Message cannot be longer than {MaxMessageLength} characters.", StatusCodes.Status400BadRequest);
        }

        return normalized;
    }

    private static ChatThreadReadDTO MapThread(ChatThread thread, int currentUserId)
    {
        var currentParticipant = thread.Participants.FirstOrDefault(item => item.UserId == currentUserId);
        var lastReadAt = currentParticipant?.LastReadAt ?? DateTime.MinValue;
        var messages = thread.Messages.OrderBy(item => item.CreatedAt).ThenBy(item => item.Id).ToList();
        var lastMessage = messages.LastOrDefault();

        return new ChatThreadReadDTO
        {
            Id = thread.Id,
            Subject = thread.Subject,
            ContextType = thread.ContextType,
            ContextId = thread.ContextId,
            CreatedByUserId = thread.CreatedByUserId,
            CreatedAt = thread.CreatedAt,
            UpdatedAt = thread.UpdatedAt,
            LastMessageAt = thread.LastMessageAt,
            LastMessage = lastMessage is null ? null : MapMessage(lastMessage),
            UnreadCount = messages.Count(item => item.SenderUserId != currentUserId && item.CreatedAt > lastReadAt),
            Participants = thread.Participants
                .OrderBy(item => item.UserId == currentUserId ? 0 : 1)
                .ThenBy(item => item.UserId)
                .Select(MapParticipant)
                .ToList(),
        };
    }

    private static ChatMessageReadDTO MapMessage(ChatMessage message) =>
        new()
        {
            Id = message.Id,
            ThreadId = message.ThreadId,
            SenderUserId = message.SenderUserId,
            Body = message.Body,
            IsSystem = message.IsSystem,
            CreatedAt = message.CreatedAt,
            Sender = message.SenderUser is null ? null : MapParticipant(message.SenderUser, null),
        };

    private static ChatParticipantDTO MapParticipant(ChatParticipant participant) =>
        MapParticipant(participant.User, participant.LastReadAt);

    private static ChatParticipantDTO MapParticipant(User user, DateTime? lastReadAt)
    {
        var role = AuthEndpointSupport.GetPublicRole(user) ?? string.Empty;
        return new ChatParticipantDTO
        {
            UserId = user.Id,
            Role = role,
            DisplayName = AuthEndpointSupport.BuildDisplayName(user, role) ?? user.Email,
            Email = user.Email,
            AvatarUrl = AuthEndpointSupport.BuildAvatarUrl(user, role),
            LastReadAt = lastReadAt,
        };
    }

    private static string BuildThreadLink(string role, int threadId) =>
        role switch
        {
            PublicRoles.Candidate => $"/candidate/messages?thread={threadId}",
            PublicRoles.Company => $"/company/dashboard/messages?thread={threadId}",
            PublicRoles.Moderator => $"/moderator/messages?thread={threadId}",
            _ => $"/?thread={threadId}",
        };
}

internal sealed class ChatAccessException : Exception
{
    public ChatAccessException(string message, int statusCode = StatusCodes.Status403Forbidden)
        : base(message)
    {
        StatusCode = statusCode;
    }

    public int StatusCode { get; }
}
