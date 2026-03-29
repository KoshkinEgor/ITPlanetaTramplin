namespace DTO;

public partial class OpportunityApplicationDTO
{
    public int opportunityId { get; set; }

    public bool? allowPeerVisibility { get; set; }
}

public class OpportunityApplicationSummaryDTO
{
    public int Id { get; set; }
    public int OpportunityId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? EmployerNote { get; set; }
    public DateTime? AppliedAt { get; set; }
    public string OpportunityTitle { get; set; } = string.Empty;
    public string OpportunityType { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string? LocationCity { get; set; }
    public string? EmploymentType { get; set; }
    public bool OpportunityDeleted { get; set; }
    public string ModerationStatus { get; set; } = string.Empty;
    public bool AllowPeerVisibility { get; set; }
    public List<string> OpportunityTags { get; set; } = [];
    public SocialContextPreviewDTO? SocialContextPreview { get; set; }
}
