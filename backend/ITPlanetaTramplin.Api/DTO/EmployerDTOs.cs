using Models;

namespace DTO
{
    public class EmployerLoginDTO
    {
        public string Login { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;

    }

    public class EmployerRegistrationDTO
    {
        public string Password { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;       
        public string CompanyName { get; set; } = null!;
        public string? Inn { get; set; }
        public string? VerificationData { get; set; }
        public string? LegalAddress { get; set; }

    }

    public partial class EmployerGetDTO
    {
        public int Id { get; set; }

        public string CompanyName { get; set; } = null!;

        public string? Inn { get; set; }

        public string? LegalAddress { get; set; }

        public string? ProfileImage { get; set; }

        public string? Description { get; set; }

        public string? Socials { get; set; }

        public string? MediaContent { get; set; }

        public virtual ICollection<Opportunity> Opportunities { get; set; } = new List<Opportunity>();

    }

    public class EmployerInnLookupDTO
    {
        public string Inn { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string? LegalName { get; set; }

        public string? LegalAddress { get; set; }

        public string? Kpp { get; set; }

        public string? Ogrn { get; set; }

        public string? Status { get; set; }

        public bool IsActive { get; set; }

        public List<string> Emails { get; set; } = new();
    }

    public class CompanyProfileReadDTO
    {
        public int UserId { get; set; }

        public int ProfileId { get; set; }

        public string Email { get; set; } = string.Empty;

        public string CompanyName { get; set; } = string.Empty;

        public string? Inn { get; set; }

        public string? LegalAddress { get; set; }

        public string? Description { get; set; }

        public string? ProfileImage { get; set; }

        public string? Socials { get; set; }

        public string? MediaContent { get; set; }

        public string? VerificationData { get; set; }

        public string? VerificationMethod { get; set; }

        public string? VerificationStatus { get; set; }
    }

    public class CompanyProfileUpdateDTO
    {
        public string? CompanyName { get; set; }

        public string? LegalAddress { get; set; }

        public string? Description { get; set; }

        public string? ProfileImage { get; set; }

        public string? Socials { get; set; }

        public string? MediaContent { get; set; }

        public string? VerificationData { get; set; }

        public string? VerificationMethod { get; set; }
    }
}
