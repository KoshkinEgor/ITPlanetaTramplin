using Models;

namespace DTO;

public class ApplicantAchievementCreateDTO
{
    public long? ObtainDate { get; set; }

    public string? Location { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }
}

public class ApplicantAchievementUpdateDTO
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public long? ObtainDate { get; set; }

    public string? Location { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }

}

public class ApplicantAchievementReadDTO
{
    public int Id { get; set; }

    public int ApplicantId { get; set; }

    public DateOnly? ObtainDate { get; set; }

    public string? Location { get; set; }

    public string? Title { get; set; }

    public string? Description { get; set; }

    public List<string>? Attachments { get; set; }
}