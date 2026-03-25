using System;
using System.Collections.Generic;

namespace Models;

public partial class ApplicantEducation
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public string InstitutionName { get; set; } = null!;

    public string? Faculty { get; set; }

    public string? Specialization { get; set; }

    public int? StartYear { get; set; }

    public int? GraduationYear { get; set; }

    public bool? IsCompleted { get; set; }

    public List<string>? Attachments { get; set; }

    public string? Description { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;
}
