using System;
using System.Collections.Generic;

namespace Models;

public partial class OpportunityApplication
{
    public int Id { get; set; }

    public int OpportunityId { get; set; }

    public int ApplicantId { get; set; }

    public DateTime? AppliedAt { get; set; }

    //public string? EmployerNote { get; set; }

    public virtual ApplicantProfile Applicant { get; set; } = null!;

    public virtual Opportunity Opportunity { get; set; } = null!;
}
