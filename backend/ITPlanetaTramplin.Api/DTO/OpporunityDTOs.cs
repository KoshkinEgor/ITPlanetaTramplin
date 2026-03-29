namespace DTO
{
    public partial class OpportunityPostDTO
    {
        public string Title { get; set; } = null!;

        public string? Description { get; set; }

        public string? SaveMode { get; set; }

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public long? ExpireAt { get; set; }

        public string OpportunityType { get; set; } = string.Empty;

        public string? EmploymentType { get; set; }

        public string? ContactsJson { get; set; }

        public string? MediaContentJson { get; set; }

        public decimal? SalaryFrom { get; set; }

        public decimal? SalaryTo { get; set; }

        public bool? IsPaid { get; set; }

        public decimal? StipendFrom { get; set; }

        public decimal? StipendTo { get; set; }

        public string? Duration { get; set; }

        public long? EventStartAt { get; set; }

        public long? RegistrationDeadline { get; set; }

        public string? MeetingFrequency { get; set; }

        public int? SeatsCount { get; set; }

        public List<string>? Tags { get; set; }
    }

    public partial class OpportunityGetDTO
    {
        public int Id { get; set; }

        public int EmployerId { get; set; }

        public string Title { get; set; } = null!;

        public string Description { get; set; } = null!;

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public DateOnly PublishAt { get; set; }

        public DateOnly? ExpireAt { get; set; }

        public string? OpportunityType { get; set; }

        public string? EmploymentType { get; set; }

        public string? ModerationStatus { get; set; }

        public string? ModerationReason { get; set; }

        public decimal? SalaryFrom { get; set; }

        public decimal? SalaryTo { get; set; }

        public bool? IsPaid { get; set; }

        public decimal? StipendFrom { get; set; }

        public decimal? StipendTo { get; set; }

        public string? Duration { get; set; }

        public DateOnly? EventStartAt { get; set; }

        public DateOnly? RegistrationDeadline { get; set; }

        public string? MeetingFrequency { get; set; }

        public int? SeatsCount { get; set; }

        public string? ContactsJson { get; set; }

        public string? MediaContentJson { get; set; }

        public string? CompanyName { get; set; }

        public string? CompanyDescription { get; set; }

        public string? CompanyLegalAddress { get; set; }

        public string? CompanySocials { get; set; }

        public OpportunityViewerCapabilitiesDTO? Viewer { get; set; }

        public List<string>? Tags { get; set; }
    }

    public partial class OpportunityUpdateDTO
    {
        public int Id { get; set; }

        public string? SaveMode { get; set; }

        public string? Title { get; set; }

        public string? Description { get; set; }

        public string? OpportunityType { get; set; }

        public string? EmploymentType { get; set; }

        public string? LocationAddress { get; set; }

        public string? LocationCity { get; set; }

        public decimal? Latitude { get; set; }

        public decimal? Longitude { get; set; }

        public long? ExpireAt { get; set; }

        public string? ContactsJson { get; set; }

        public string? MediaContentJson { get; set; }

        public decimal? SalaryFrom { get; set; }

        public decimal? SalaryTo { get; set; }

        public bool? IsPaid { get; set; }

        public decimal? StipendFrom { get; set; }

        public decimal? StipendTo { get; set; }

        public string? Duration { get; set; }

        public long? EventStartAt { get; set; }

        public long? RegistrationDeadline { get; set; }

        public string? MeetingFrequency { get; set; }

        public int? SeatsCount { get; set; }

        public List<string>? Tags { get; set; }
    }

    public partial class OpportunityDeleteDTO
    {
        public int Id { get; set; }
    }

    public class OpportunityViewerCapabilitiesDTO
    {
        public bool IsOwner { get; set; }

        public bool CanEdit { get; set; }

        public bool CanDelete { get; set; }

        public bool CanSaveDraft { get; set; }

        public bool CanSubmit { get; set; }

        public bool CanArchive { get; set; }

        public bool CanViewPublicVersion { get; set; }

        public bool CanViewResponses { get; set; }
    }
}
