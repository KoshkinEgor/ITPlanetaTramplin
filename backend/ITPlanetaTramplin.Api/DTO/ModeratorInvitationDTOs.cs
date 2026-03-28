namespace DTO;

public class ModeratorInvitationCreateDTO
{
    public string Email { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public string Surname { get; set; } = string.Empty;

    public string? Thirdname { get; set; }
}

public class ModeratorInvitationAcceptDTO
{
    public string Password { get; set; } = string.Empty;
}

public class ModeratorInvitationResultDTO : MessageResponseDTO
{
    public int InvitationId { get; set; }

    public string Email { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public bool EmailDeliveryFailed { get; set; }

    public string? InvitationUrl { get; set; }

    public string? DebugToken { get; set; }
}

public class ModeratorInvitationDetailsDTO : MessageResponseDTO
{
    public string Email { get; set; } = string.Empty;

    public string DisplayName { get; set; } = string.Empty;

    public string InvitedByDisplayName { get; set; } = string.Empty;

    public DateTime ExpiresAtUtc { get; set; }

    public bool IsExpired { get; set; }

    public bool IsAccepted { get; set; }

    public bool IsRevoked { get; set; }
}
