using System;
using System.Collections.Generic;

namespace Models;

public partial class ChatThread
{
    public int Id { get; set; }

    public string Subject { get; set; } = string.Empty;

    public string ContextType { get; set; } = "direct";

    public int? ContextId { get; set; }

    public int CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public DateTime LastMessageAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<ChatParticipant> Participants { get; set; } = new List<ChatParticipant>();

    public virtual ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
