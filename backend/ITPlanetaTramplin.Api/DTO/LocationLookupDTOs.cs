namespace DTO;

public class AddressSuggestionDTO
{
    public string Value { get; set; } = string.Empty;

    public string UnrestrictedValue { get; set; } = string.Empty;

    public string Label { get; set; } = string.Empty;

    public string? Details { get; set; }

    public string? City { get; set; }

    public string? Street { get; set; }

    public string? House { get; set; }

    public string Kind { get; set; } = "address";

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public string? StreetFiasId { get; set; }

    public string? FiasId { get; set; }
}

public class AddressLookupResponseDTO
{
    public List<AddressSuggestionDTO> Suggestions { get; set; } = new();

    public List<AddressSuggestionDTO> NearbyStreetMatches { get; set; } = new();
}
