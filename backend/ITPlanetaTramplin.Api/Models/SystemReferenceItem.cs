using System;

namespace Models;

public partial class SystemReferenceItem
{
    public int Id { get; set; }

    public string Category { get; set; } = null!;

    public string Key { get; set; } = null!;

    public string Label { get; set; } = null!;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsSystem { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedByUserId { get; set; }

    public virtual User? UpdatedByUser { get; set; }
}
