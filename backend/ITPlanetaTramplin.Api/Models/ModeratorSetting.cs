using System;

namespace Models;

public partial class ModeratorSetting
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string NotificationSettingsJson { get; set; } = "{}";

    public string QueueSettingsJson { get; set; } = "{}";

    public string? StartPage { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
