using System;

namespace Models;

public partial class OpportunityShare
{
    public int Id { get; set; }

    public int SenderUserId { get; set; }

    public int RecipientUserId { get; set; }

    public int OpportunityId { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User SenderUser { get; set; } = null!;

    public virtual User RecipientUser { get; set; } = null!;

    public virtual Opportunity Opportunity { get; set; } = null!;
}
