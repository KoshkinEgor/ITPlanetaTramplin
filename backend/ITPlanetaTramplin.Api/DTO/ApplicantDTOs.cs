namespace DTO
{
    public class ApplicantLoginDTO
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

    }
    
    public class ApplicantRegistrationDTO
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string Thirdname { get; set; } = string.Empty;

    }

    public class AplicantGetDTO
    {
        public int Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Surname { get; set; } = string.Empty;
        public string Thirdname { get; set; } = string.Empty;
    }

    public class CandidateProfileReadDTO
    {
        public int UserId { get; set; }

        public int ProfileId { get; set; }

        public string Email { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Surname { get; set; } = string.Empty;

        public string? Thirdname { get; set; }

        public string? Description { get; set; }

        public string ModerationStatus { get; set; } = string.Empty;

        public List<string>? Skills { get; set; }

        public object? Links { get; set; }
    }

    public class CandidateProfileUpdateDTO
    {
        public string? Name { get; set; }

        public string? Surname { get; set; }

        public string? Thirdname { get; set; }

        public string? Description { get; set; }

        public List<string>? Skills { get; set; }

        public object? Links { get; set; }
    }
}
