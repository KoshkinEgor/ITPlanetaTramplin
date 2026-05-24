namespace DTO;

public class ChatParticipantDTO
{
    public int UserId { get; set; }

    public string Role { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string? AvatarUrl { get; set; }

    public DateTime? LastReadAt { get; set; }
}

public class ChatMessageReadDTO
{
    public int Id { get; set; }

    public int ThreadId { get; set; }

    public int SenderUserId { get; set; }

    public string Body { get; set; } = string.Empty;

    public bool IsSystem { get; set; }

    public DateTime CreatedAt { get; set; }

    public ChatParticipantDTO? Sender { get; set; }
}

public class ChatThreadReadDTO
{
    public int Id { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string ContextType { get; set; } = "direct";

    public int? ContextId { get; set; }

    public int CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime LastMessageAt { get; set; }

    public int UnreadCount { get; set; }

    public ChatMessageReadDTO? LastMessage { get; set; }

    public List<ChatParticipantDTO> Participants { get; set; } = [];
}

public class ChatStartDTO
{
    public int RecipientUserId { get; set; }

    public string? ContextType { get; set; }

    public int? ContextId { get; set; }

    public string? Subject { get; set; }

    public string? InitialMessage { get; set; }
}

public class ChatMessageCreateDTO
{
    public string Body { get; set; } = string.Empty;
}

public class ChatSendResultDTO
{
    public ChatThreadReadDTO Thread { get; set; } = new();

    public ChatMessageReadDTO Message { get; set; } = new();
}

public class ChatReadStateDTO
{
    public int ThreadId { get; set; }

    public int UserId { get; set; }

    public DateTime LastReadAt { get; set; }
}
