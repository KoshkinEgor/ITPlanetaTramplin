namespace DTO;

public class ModerationDecisionDTO
{
    public string Status { get; set; } = string.Empty;

    public string? Reason { get; set; }
}

public class OpportunityApplicationStatusUpdateDTO
{
    public string Status { get; set; } = string.Empty;

    public string? EmployerNote { get; set; }
}
