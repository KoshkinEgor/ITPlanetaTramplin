using System;

namespace Models;

public partial class CompanySetting
{
    public int Id { get; set; }

    public int EmployerId { get; set; }

    public string? NotificationEmail { get; set; }

    public bool NotifyNewApplications { get; set; } = true;

    public bool NotifyModerationUpdates { get; set; } = true;

    public bool NotifyComplaintsAndSystem { get; set; } = true;

    public string DefaultStartSection { get; set; } = "profile";

    public string DefaultResponsesSort { get; set; } = "newest";

    public bool ShowArchivedOpportunities { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual EmployerProfile Employer { get; set; } = null!;
}
