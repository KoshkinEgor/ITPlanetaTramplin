namespace DTO;

public sealed class AiCareerRecommendationResponseDTO
{
    public string Summary { get; set; } = string.Empty;

    public List<string> NextActions { get; set; } = [];

    public List<string> MissingSkills { get; set; } = [];

    public List<AiCareerPlanStepDTO> CareerPlan { get; set; } = [];

    public List<AiCareerRecommendationSectionDTO> Sections { get; set; } = [];

    public List<AiCareerRecommendationItemDTO> Items { get; set; } = [];

    public bool IsFallback { get; set; }
}

public sealed class AiCareerPlanStepDTO
{
    public string Day { get; set; } = string.Empty;

    public string Action { get; set; } = string.Empty;

    public string Outcome { get; set; } = string.Empty;
}

public sealed class AiCareerRecommendationSectionDTO
{
    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public List<AiCareerRecommendationItemDTO> Items { get; set; } = [];
}

public sealed class AiCareerRecommendationItemDTO
{
    public int OpportunityId { get; set; }

    public int MatchPercent { get; set; }

    public string Reason { get; set; } = string.Empty;

    public List<string> MatchedSkills { get; set; } = [];

    public List<string> MissingSkills { get; set; } = [];

    public string NextStep { get; set; } = string.Empty;
}

public sealed class AiResumeAnalysisResponseDTO
{
    public int Score { get; set; }

    public string Summary { get; set; } = string.Empty;

    public List<string> Strengths { get; set; } = [];

    public List<string> Issues { get; set; } = [];

    public List<string> SuggestedSkills { get; set; } = [];

    public string ImprovedDescription { get; set; } = string.Empty;

    public List<string> NextActions { get; set; } = [];

    public bool IsFallback { get; set; }
}

public sealed class AiOpportunityFitResponseDTO
{
    public int Score { get; set; }

    public string Reason { get; set; } = string.Empty;

    public List<string> MatchedSkills { get; set; } = [];

    public List<string> MissingSkills { get; set; } = [];

    public string RecommendedDescription { get; set; } = string.Empty;

    public List<string> NextActions { get; set; } = [];

    public bool IsFallback { get; set; }
}

public sealed class AiOpportunityTagSuggestionRequestDTO
{
    public string? Title { get; set; }

    public string? Description { get; set; }

    public string? OpportunityType { get; set; }

    public string? EmploymentType { get; set; }

    public string? ExperienceLevel { get; set; }

    public string? Schedule { get; set; }
}

public sealed class AiOpportunityTagSuggestionResponseDTO
{
    public List<string> Tags { get; set; } = [];

    public List<string> PendingTags { get; set; } = [];

    public List<string> ImprovementTips { get; set; } = [];

    public string Reason { get; set; } = string.Empty;

    public bool IsFallback { get; set; }
}
