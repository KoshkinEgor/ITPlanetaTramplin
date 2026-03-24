using System;
using System.Collections.Generic;

namespace Models;

public partial class VApplicantStat
{
    public int? ProfileId { get; set; }

    public long? ApplicationCount { get; set; }

    public long? ProjectsCount { get; set; }

    public long? ContactCount { get; set; }
}
