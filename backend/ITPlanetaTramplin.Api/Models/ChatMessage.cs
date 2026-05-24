using System;

namespace Models;

public partial class ChatMessage
{
    public int Id { get; set; }

    public int ThreadId { get; set; }

    public int SenderUserId { get; set; }

    public string Body { get; set; } = string.Empty;

    public bool IsSystem { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ChatThread Thread { get; set; } = null!;

    public virtual User SenderUser { get; set; } = null!;
}
