using System;
using System.Collections.Generic;

namespace Models;

public partial class EmployerProfile
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string CompanyName { get; set; } = null!;

    public string? Inn { get; set; }

    public string? VerificationData { get; set; }
    public string VerificationStatus { get; set; } = string.Empty;

    public string? LegalAddress { get; set; }

    public string? ProfileImage { get; set; }

    public string? Description { get; set; }

    public string? Socials { get; set; }

    public string? VerificationMethod { get; set; }

    public string? MediaContent { get; set; }

    public virtual ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();

    public virtual User User { get; set; } = null!;
}
