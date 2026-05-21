using System;

namespace Models;

public partial class ModerationAuditLog
{
    public int Id { get; set; }

    public int? ActorUserId { get; set; }

    public string Action { get; set; } = null!;

    public string EntityType { get; set; } = null!;

    public int? EntityId { get; set; }

    public string Summary { get; set; } = null!;

    public string MetadataJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; }

    public virtual User? ActorUser { get; set; }
}
