using System;
using System.Collections.Generic;

namespace Models;

public partial class Tag
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? CreatedBy { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public int? UpdatedByUserId { get; set; }

    public int? MergedIntoTagId { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual User? UpdatedByUser { get; set; }

    public virtual Tag? MergedIntoTag { get; set; }

    public virtual ICollection<Tag> MergedTags { get; set; } = new List<Tag>();

    public virtual ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
}
