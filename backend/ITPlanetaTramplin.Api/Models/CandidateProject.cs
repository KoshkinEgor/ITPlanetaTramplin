using System;
using System.Collections.Generic;

namespace Models;

public partial class CandidateProject
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public string Title { get; set; } = null!;

    public string ProjectType { get; set; } = null!;

    public string ShortDescription { get; set; } = null!;

    public string? Organization { get; set; }

    public string Role { get; set; } = null!;

    public int? TeamSize { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly? EndDate { get; set; }

    public bool IsOngoing { get; set; }

    public string Problem { get; set; } = null!;

    public string Contribution { get; set; } = null!;

    public string Result { get; set; } = null!;

    public string? Metrics { get; set; }

    public string? LessonsLearned { get; set; }

    public List<string>? Tags { get; set; }

    public string? CoverImageUrl { get; set; }

    public string? ParticipantsJson { get; set; }

    public string? DemoUrl { get; set; }

    public string? RepositoryUrl { get; set; }

    public string? DesignUrl { get; set; }

    public string? CaseStudyUrl { get; set; }

    public bool ShowInPortfolio { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;
}
