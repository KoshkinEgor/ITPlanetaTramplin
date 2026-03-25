using System;
using System.Collections.Generic;

namespace Models;

public partial class Contact
{
    public int UserId { get; set; }

    public int ContactProfileId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User ContactProfile { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
