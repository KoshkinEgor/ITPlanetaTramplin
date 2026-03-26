using System;
using System.Collections.Generic;

namespace Models;

public partial class User
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public bool? IsVerified { get; set; }

    public bool? PreVerify { get; set; }

    public string? EmailVerificationCodeHash { get; set; }

    public DateTime? EmailVerificationExpiresAt { get; set; }

    public DateTime? EmailVerificationSentAt { get; set; }

    public int EmailVerificationAttemptCount { get; set; }

    public string? PasswordResetCodeHash { get; set; }

    public DateTime? PasswordResetExpiresAt { get; set; }

    public DateTime? PasswordResetSentAt { get; set; }

    public int PasswordResetAttemptCount { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? DeletedAt { get; set; }


    //public virtual ICollection<Contact> ContactContactNavigations { get; set; } = new List<Contact>();

    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();

    public virtual ApplicantProfile? ApplicantProfile { get; set; }

    public virtual CuratorProfile? CuratorProfile { get; set; }

    public virtual EmployerProfile? EmployerProfile { get; set; }

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
