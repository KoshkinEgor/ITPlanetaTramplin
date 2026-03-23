using Models;

namespace DTO;

public class RecommendationCreateDTO
{
    public int Id { get; set; }

    public int CandidateId { get; set; }

    public int OpportunityId { get; set; }

    public string? Message { get; set; }

}

