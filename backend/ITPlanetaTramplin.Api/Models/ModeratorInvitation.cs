using System;

namespace Models;

public partial class ModeratorInvitation
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string? Thirdname { get; set; }

    public int InvitedByUserId { get; set; }

    public int? AcceptedUserId { get; set; }

    public string TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? AcceptedAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User InvitedByUser { get; set; } = null!;

    public virtual User? AcceptedUser { get; set; }
}
