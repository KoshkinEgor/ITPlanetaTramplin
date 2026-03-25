using System;
using System.Collections.Generic;

namespace Models;

public partial class VApplicantStat
{
    public int? ProfileId { get; set; }

    public long? ResponsesCount { get; set; }

    public long? EducationsCount { get; set; }

    public long? AchievementsCount { get; set; }

    public long? ContactCount { get; set; }
}
