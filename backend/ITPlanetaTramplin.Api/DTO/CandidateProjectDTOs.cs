namespace DTO;

public class CandidateProjectParticipantDTO
{
    public string Name { get; set; } = string.Empty;

    public string? Role { get; set; }
}

public class CandidateProjectCreateDTO
{
    public string Title { get; set; } = string.Empty;

    public string ProjectType { get; set; } = string.Empty;

    public string ShortDescription { get; set; } = string.Empty;

    public string? Organization { get; set; }

    public string Role { get; set; } = string.Empty;

    public int? TeamSize { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; }

    public bool IsOngoing { get; set; }

    public string Problem { get; set; } = string.Empty;

    public string Contribution { get; set; } = string.Empty;

    public string Result { get; set; } = string.Empty;

    public string? Metrics { get; set; }

    public string? LessonsLearned { get; set; }

    public List<string>? Tags { get; set; }

    public string? CoverImageUrl { get; set; }

    public List<CandidateProjectParticipantDTO>? Participants { get; set; }

    public string? DemoUrl { get; set; }

    public string? RepositoryUrl { get; set; }

    public string? DesignUrl { get; set; }

    public string? CaseStudyUrl { get; set; }

    public bool ShowInPortfolio { get; set; } = true;
}

public class CandidateProjectUpdateDTO
{
    public string? Title { get; set; }

    public string? ProjectType { get; set; }

    public string? ShortDescription { get; set; }

    public string? Organization { get; set; }

    public string? Role { get; set; }

    public int? TeamSize { get; set; }

    public string? StartDate { get; set; }

    public string? EndDate { get; set; }

    public bool? IsOngoing { get; set; }

    public string? Problem { get; set; }

    public string? Contribution { get; set; }

    public string? Result { get; set; }

    public string? Metrics { get; set; }

    public string? LessonsLearned { get; set; }

    public List<string>? Tags { get; set; }

    public string? CoverImageUrl { get; set; }

    public List<CandidateProjectParticipantDTO>? Participants { get; set; }

    public string? DemoUrl { get; set; }

    public string? RepositoryUrl { get; set; }

    public string? DesignUrl { get; set; }

    public string? CaseStudyUrl { get; set; }

    public bool? ShowInPortfolio { get; set; }
}

public class CandidateProjectReadDTO
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public string Title { get; set; } = string.Empty;

    public string ProjectType { get; set; } = string.Empty;

    public string ShortDescription { get; set; } = string.Empty;

    public string? Organization { get; set; }

    public string Role { get; set; } = string.Empty;

    public int? TeamSize { get; set; }

    public string StartDate { get; set; } = string.Empty;

    public string? EndDate { get; set; }

    public bool IsOngoing { get; set; }

    public string Problem { get; set; } = string.Empty;

    public string Contribution { get; set; } = string.Empty;

    public string Result { get; set; } = string.Empty;

    public string? Metrics { get; set; }

    public string? LessonsLearned { get; set; }

    public List<string>? Tags { get; set; }

    public string? CoverImageUrl { get; set; }

    public List<CandidateProjectParticipantDTO>? Participants { get; set; }

    public string? DemoUrl { get; set; }

    public string? RepositoryUrl { get; set; }

    public string? DesignUrl { get; set; }

    public string? CaseStudyUrl { get; set; }

    public bool ShowInPortfolio { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
