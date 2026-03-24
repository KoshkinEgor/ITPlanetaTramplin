using System;
using System.Collections.Generic;

namespace Models;

public partial class ApplicantProfile
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string? Thirdname { get; set; }

    public string? Description { get; set; }

    public List<string>? Skills { get; set; }

    public string? Links { get; set; }

    public string? PrivacySettings { get; set; }

    public virtual ICollection<ApplicantAchievement> ApplicantAchievements { get; set; } = new List<ApplicantAchievement>();

    public virtual ICollection<ApplicantEducation> ApplicantEducations { get; set; } = new List<ApplicantEducation>();

    public virtual ICollection<OpportunityApplication> Applications { get; set; } = new List<OpportunityApplication>();

    public virtual ICollection<Recommendation> RecommendationCandidates { get; set; } = new List<Recommendation>();

    public virtual ICollection<Recommendation> RecommendationRecommenders { get; set; } = new List<Recommendation>();
    public virtual ICollection<Project> Projects {get;set;} = new List<Project>();
    public virtual User User { get; set; } = null!;
}
