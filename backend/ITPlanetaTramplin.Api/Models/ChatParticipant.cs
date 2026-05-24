using System;

namespace Models;

public partial class ChatParticipant
{
    public int ThreadId { get; set; }

    public int UserId { get; set; }

    public string Role { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? LastReadAt { get; set; }

    public bool IsMuted { get; set; }

    public virtual ChatThread Thread { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
