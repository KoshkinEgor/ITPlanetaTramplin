using System;
using System.Collections.Generic;

namespace Models;

public partial class CuratorProfile
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string? Thirdname { get; set; }

    public virtual User User { get; set; } = null!;
}
