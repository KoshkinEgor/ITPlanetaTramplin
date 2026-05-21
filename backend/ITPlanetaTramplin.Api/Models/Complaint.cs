using System;

namespace Models;

public partial class Complaint
{
    public int Id { get; set; }

    public int ReporterUserId { get; set; }

    public int OpportunityId { get; set; }

    public string Reason { get; set; } = string.Empty;

    public string? Description { get; set; }

    public string Status { get; set; } = "pending";

    public string? ModeratorNote { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public int? ResolvedByUserId { get; set; }

    public virtual User ReporterUser { get; set; } = null!;

    public virtual ICollection<UserNotification> Notifications { get; set; } = new List<UserNotification>();

    public virtual Opportunity Opportunity { get; set; } = null!;

    public virtual User? ResolvedByUser { get; set; }
}
