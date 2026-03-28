using System;

namespace Models;

public partial class FriendRequest
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public virtual User SenderUser { get; set; } = null!;

    public virtual User RecipientUser { get; set; } = null!;
}
