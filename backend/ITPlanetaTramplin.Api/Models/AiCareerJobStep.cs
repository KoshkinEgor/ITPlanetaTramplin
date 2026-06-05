namespace Models;

public class AiCareerJobStep
{
    public int Id { get; set; }

    public Guid JobId { get; set; }

    public string Step { get; set; } = string.Empty;

    public string Status { get; set; } = "queued";

    public int AttemptCount { get; set; }

    public DateTime AvailableAt { get; set; }

    public DateTime? LeaseUntil { get; set; }

    public DateTime? StartedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string? ErrorCode { get; set; }

    public string? ErrorMessage { get; set; }

    public virtual AiCareerJob Job { get; set; } = null!;
}
