using DTO;
using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CommonEndpointTests
{
    [Fact]
    public async Task AddressSuggestions_ReturnPrimaryMatchesAndNearbyHousesForStreetQuery()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/location/address-suggestions?query=%D0%A2%D0%B5%D1%81%D1%82%D0%BE%D0%B2%D0%B0%D1%8F&city=%D0%9C%D0%BE%D1%81%D0%BA%D0%B2%D0%B0");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AddressLookupResponseDTO>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Suggestions);
        Assert.Equal("street", payload.Suggestions[0].Kind);
        Assert.Equal("Тестовая улица", payload.Suggestions[0].Label);
        Assert.NotEmpty(payload.NearbyStreetMatches);
        Assert.All(payload.NearbyStreetMatches, item =>
        {
            Assert.Equal("house", item.Kind);
            Assert.Equal("Тестовая улица", item.Street);
            Assert.Equal("Москва", item.City);
        });
    }

    [Fact]
    public async Task AddressSuggestions_ReturnsCityMatchForLocalityQuery()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/location/address-suggestions?query=%D0%A7%D0%B5%D0%B1%D0%BE%D0%BA%D1%81%D0%B0%D1%80%D1%8B");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AddressLookupResponseDTO>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Suggestions);
        Assert.Equal("city", payload.Suggestions[0].Kind);
        Assert.Equal("Чебоксары", payload.Suggestions[0].Label);
        Assert.Equal(56.143900m, payload.Suggestions[0].Latitude);
        Assert.Equal(47.251888m, payload.Suggestions[0].Longitude);
    }

    [Fact]
    public async Task ReverseGeocode_ReturnsNearestAddressesForPoint()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/location/reverse-geocode?latitude=55.75581&longitude=37.61771");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<AddressLookupResponseDTO>();
        Assert.NotNull(payload);
        Assert.NotEmpty(payload!.Suggestions);
        Assert.Equal("house", payload.Suggestions[0].Kind);
        Assert.Equal("Тестовая улица, д. 1", payload.Suggestions[0].Label);
        Assert.Equal(55.755810m, payload.Suggestions[0].Latitude);
        Assert.Equal(37.617710m, payload.Suggestions[0].Longitude);
    }
}
