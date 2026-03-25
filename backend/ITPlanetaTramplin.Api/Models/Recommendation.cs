using System;
using System.Collections.Generic;

namespace Models;

public partial class Recommendation
{
    public int Id { get; set; }

    public int RecommenderId { get; set; }

    public int CandidateId { get; set; }

    public int OpportunityId { get; set; }

    public string? Message { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ApplicantProfile Candidate { get; set; } = null!;

    public virtual Opportunity Opportunity { get; set; } = null!;

    public virtual ApplicantProfile Recommender { get; set; } = null!;
}
