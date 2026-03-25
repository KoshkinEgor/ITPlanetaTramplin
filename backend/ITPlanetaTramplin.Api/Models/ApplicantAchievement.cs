using System;
using System.Collections.Generic;

namespace Models;

public partial class ApplicantAchievement
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public DateOnly? ObtainDate { get; set; }

    public string? Location { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;
}
