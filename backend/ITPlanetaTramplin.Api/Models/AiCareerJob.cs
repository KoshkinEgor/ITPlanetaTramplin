namespace Models;

public class AiCareerJob
{
    public Guid Id { get; set; }

    public int ApplicantId { get; set; }

    public string Status { get; set; } = "queued";

    public string Reason { get; set; } = "manual";

    public string Signature { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;

    public virtual ICollection<AiCareerJobStep> Steps { get; set; } = new List<AiCareerJobStep>();
}
