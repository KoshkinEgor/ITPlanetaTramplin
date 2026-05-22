namespace DTO;

public class UserNotificationReadDTO
{
    public int Id { get; set; }

    public string Type { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string? Message { get; set; }

    public string? Link { get; set; }

    public bool IsRead { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? ReadAt { get; set; }

    public int? ActorUserId { get; set; }

    public int? OpportunityId { get; set; }

    public int? ApplicationId { get; set; }

    public int? ComplaintId { get; set; }
}
