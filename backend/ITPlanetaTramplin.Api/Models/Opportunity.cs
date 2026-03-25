using System;
using System.Collections.Generic;
using NpgsqlTypes;

namespace Models;

public partial class Opportunity
{
    public int Id { get; set; }

    public int EmployerId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? LocationAddress { get; set; }

    public string? LocationCity { get; set; }

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string OpportunityType { get; set; } = string.Empty;

    public string EmploymentType { get; set; } = string.Empty;

    public string ModerationStatus { get; set; } = null!;

    public DateOnly PublishAt { get; set; }

    public DateOnly? ExpireAt { get; set; }

    public DateOnly? DeletedAt { get; set; }

    public string? ContactsJson { get; set; }

    public string? MediaContentJson { get; set; }

    public NpgsqlTsVector? SearchVector { get; set; }

    public virtual ICollection<OpportunityApplication> Applications { get; set; } = new List<OpportunityApplication>();

    public virtual EmployerProfile Employer { get; set; } = null!;

    public virtual ICollection<Recommendation> Recommendations { get; set; } = new List<Recommendation>();

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
