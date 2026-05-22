using System;

namespace Models;

public partial class UserNotification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Message { get; set; }

    public string? Link { get; set; }

    public bool IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ReadAt { get; set; }

    public int? ActorUserId { get; set; }

    public int? OpportunityId { get; set; }

    public int? ApplicationId { get; set; }

    public int? ComplaintId { get; set; }

    public string? MetadataJson { get; set; }

    public virtual User User { get; set; } = null!;

    public virtual User? ActorUser { get; set; }

    public virtual Opportunity? Opportunity { get; set; }

    public virtual OpportunityApplication? Application { get; set; }

    public virtual Complaint? Complaint { get; set; }
}
