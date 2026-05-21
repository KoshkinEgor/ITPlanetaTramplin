namespace DTO;

public class ComplaintCreateDTO
{
    public string Reason { get; set; } = string.Empty;

    public string? Description { get; set; }
}

public class ComplaintDecisionDTO
{
    public string Status { get; set; } = string.Empty;

    public string? Reason { get; set; }
}

public class ComplaintReadDTO
{
    public int Id { get; set; }

    public int OpportunityId { get; set; }

    public string OpportunityTitle { get; set; } = string.Empty;

    public int EmployerId { get; set; }

    public string CompanyName { get; set; } = string.Empty;

    public int ReporterUserId { get; set; }

    public string ReporterEmail { get; set; } = string.Empty;

    public string Reason { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Status { get; set; } = string.Empty;

    public string? ModeratorNote { get; set; }

    public int Count { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }
}
