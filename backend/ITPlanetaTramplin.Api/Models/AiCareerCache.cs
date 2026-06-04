using System;

namespace Models;

public partial class AiCareerCache
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public string Scope { get; set; } = string.Empty;

    public string Signature { get; set; } = string.Empty;

    public string PayloadJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; }

    public DateTime ExpiresAt { get; set; }

    public DateTime? LastServedAt { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;
}
