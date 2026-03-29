namespace DTO;

public class FriendRequestCreateDTO
{
    public int UserId { get; set; }
}

public class FriendRequestReadDTO
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public SocialUserSummaryDTO Counterparty { get; set; } = new();
}

public class CandidateProjectInviteCreateDTO
{
    public int RecipientUserId { get; set; }

    public int ProjectId { get; set; }

    public string? Role { get; set; }

    public string? Message { get; set; }
}

public class CandidateProjectInviteReadDTO
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public int ProjectId { get; set; }

    public string? ProjectTitle { get; set; }

    public string? Role { get; set; }

    public string? Message { get; set; }

    public string Status { get; set; } = string.Empty;

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public DateTime? RespondedAt { get; set; }

    public SocialUserSummaryDTO Counterparty { get; set; } = new();
}

public class OpportunityShareCreateDTO
{
    public int OpportunityId { get; set; }

    public int RecipientUserId { get; set; }

    public string? Note { get; set; }
}

public class OpportunityShareReadDTO
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public int OpportunityId { get; set; }

    public string OpportunityTitle { get; set; } = string.Empty;

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public SocialUserSummaryDTO Counterparty { get; set; } = new();
}

public class RelationshipSummaryDTO
{
    public string ContactState { get; set; } = "none";

    public string FriendState { get; set; } = "none";

    public string ProjectInviteState { get; set; } = "none";

    public int? FriendRequestId { get; set; }

    public int? ProjectInviteId { get; set; }

    public bool CanInviteToProject { get; set; }
}

public class SocialUserSummaryDTO
{
    public int UserId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string? City { get; set; }

    public List<string>? Skills { get; set; }

    public List<string> Reasons { get; set; } = [];

    public RelationshipSummaryDTO Relationship { get; set; } = new();
}

public class CompanyContactDTO
{
    public string Type { get; set; } = "link";

    public string Label { get; set; } = string.Empty;

    public string Value { get; set; } = string.Empty;

    public string Href { get; set; } = string.Empty;
}

public class SocialContextPreviewDTO
{
    public List<CompanyContactDTO> CompanyContactsPreview { get; set; } = [];

    public List<SocialUserSummaryDTO> NetworkCandidatesPreview { get; set; } = [];

    public int PeerCount { get; set; }

    public int IncomingShareCount { get; set; }
}

public class OpportunitySocialContextCountsDTO
{
    public int NetworkCandidateCount { get; set; }

    public int PeerCount { get; set; }

    public int IncomingShareCount { get; set; }
}

public class OpportunitySocialContextDTO
{
    public List<CompanyContactDTO> CompanyContacts { get; set; } = [];

    public List<SocialUserSummaryDTO> NetworkCandidates { get; set; } = [];

    public List<SocialUserSummaryDTO> Peers { get; set; } = [];

    public OpportunitySocialContextCountsDTO Counts { get; set; } = new();
}

public class CandidatePublicProfileReadDTO
{
    public int UserId { get; set; }

    public int ProfileId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string? Thirdname { get; set; }

    public string? Description { get; set; }

    public List<string>? Skills { get; set; }

    public object? Links { get; set; }

    public object? SocialLinks { get; set; }

    public object? Education { get; set; }

    public bool HasProjects { get; set; }

    public bool HasResumes { get; set; }

    public bool HasSocialLinks { get; set; }

    public bool CanSeeProjects { get; set; }

    public bool CanSeeSocialLinks { get; set; }

    public List<object> Projects { get; set; } = [];

    public List<object> Resumes { get; set; } = [];

    public RelationshipSummaryDTO Relationship { get; set; } = new();
}
