namespace DTO;

public class AuthUserDTO
{
    public int Id { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public bool IsVerified { get; set; }

    public bool PreVerify { get; set; }

    public string? DisplayName { get; set; }
}

public class AuthResponseDTO
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public AuthUserDTO User { get; set; } = new();
}

public class AuthLoginRequestDTO
{
    public string Role { get; set; } = string.Empty;

    public string Login { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}

public class MessageResponseDTO
{
    public string Message { get; set; } = string.Empty;
}

public class PendingEmailVerificationDTO : MessageResponseDTO
{
    public int? UserId { get; set; }

    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string VerificationFlow { get; set; } = string.Empty;

    public DateTime? ExpiresAtUtc { get; set; }

    public bool RequiresEmailVerification { get; set; } = true;

    public bool EmailDeliveryFailed { get; set; }

    public string? DebugCode { get; set; }
}

public class PasswordResetRequestResultDTO : MessageResponseDTO
{
    public string Email { get; set; } = string.Empty;

    public DateTime? ExpiresAtUtc { get; set; }

    public bool EmailDeliveryFailed { get; set; }

    public string? DebugCode { get; set; }
}

public class EmailVerificationConfirmDTO
{
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;
}

public class EmailVerificationResendDTO
{
    public string Email { get; set; } = string.Empty;

    public string Role { get; set; } = string.Empty;
}

public class ForgotPasswordRequestDTO
{
    public string Email { get; set; } = string.Empty;
}

public class ResetPasswordRequestDTO
{
    public string Email { get; set; } = string.Empty;

    public string Code { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}
