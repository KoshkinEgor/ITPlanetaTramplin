using System;
using System.Collections.Generic;

namespace Models;

public partial class Tag
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public int? CreatedBy { get; set; }

    public bool? IsActive { get; set; }

    public virtual User? CreatedByNavigation { get; set; }

    public virtual ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();
}
