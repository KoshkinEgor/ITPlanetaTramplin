using Models;

namespace DTO
{
    public class ApplicantEducationCreateDTO
    {
        public string InstitutionName { get; set; } = null!;

        public string? Faculty { get; set; }

        public string? Specialization { get; set; }

        public int? StartYear { get; set; }

        public int? GraduationYear { get; set; }

        public bool? IsCompleted { get; set; }

        public string? Description { get; set; }
    }

    public class ApplicantEducationReadDTO
    {
        public int Id { get; set; }

        public string InstitutionName { get; set; } = null!;

        public string? Faculty { get; set; }

        public string? Specialization { get; set; }

        public int? StartYear { get; set; }

        public int? GraduationYear { get; set; }

        public bool? IsCompleted { get; set; }

        public List<string>? Attachments { get; set; }

        public string? Description { get; set; }

    }

    public class ApplicantEducationUpdateDTO
    {
        public int Id { get; set; }

        public string? InstitutionName { get; set; } = null!;

        public string? Faculty { get; set; }

        public string? Specialization { get; set; }

        public int? StartYear { get; set; }

        public int? GraduationYear { get; set; }

        public bool? IsCompleted { get; set; }

        public List<string>? Attachments { get; set; }

        public string? Description { get; set; }
    }


}
