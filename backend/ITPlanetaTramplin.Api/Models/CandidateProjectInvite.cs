using System;

namespace Models;

public partial class CandidateProjectInvite
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public int ProjectId { get; set; }

    public string? Role { get; set; }

    public string? Message { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public virtual CandidateProject Project { get; set; } = null!;

    public virtual User SenderUser { get; set; } = null!;

    public virtual User RecipientUser { get; set; } = null!;
}
