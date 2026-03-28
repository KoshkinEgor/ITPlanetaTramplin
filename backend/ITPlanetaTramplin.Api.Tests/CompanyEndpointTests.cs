using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Models;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Xunit;

namespace ITPlanetaTramplin.Api.Tests;

public class CompanyEndpointTests
{
    [Fact]
    public async Task GetPublicCompany_ReturnsApprovedCompanyWithMediaSections()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        int companyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            companyId = await db.EmployerProfiles
                .Where(item => item.Inn == "7707083893")
                .Select(item => item.Id)
                .SingleAsync();
        }

        var response = await client.GetAsync($"/api/companies/{companyId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(payload);
        Assert.Equal(companyId, payload!.ProfileId);
        Assert.Equal("approved", payload.VerificationStatus);
        Assert.False(string.IsNullOrWhiteSpace(payload.HeroMediaJson));
        Assert.False(string.IsNullOrWhiteSpace(payload.CaseStudiesJson));
        Assert.False(string.IsNullOrWhiteSpace(payload.GalleryJson));
    }

    [Fact]
    public async Task GetPublicCompany_ReturnsNotFoundForUnapprovedCompany()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        int companyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            profile.VerificationStatus = CompanyVerificationStatuses.Revision;
            await db.SaveChangesAsync();
            companyId = profile.Id;
        }

        var response = await client.GetAsync($"/api/companies/{companyId}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task GetPublicCompanyOpportunities_ReturnsOnlyApprovedAndActiveItems()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        int companyId;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            companyId = profile.Id;

            db.Opportunities.AddRange(
                new Opportunity
                {
                    EmployerId = profile.Id,
                    Title = "Pending public opportunity",
                    Description = "Should not be visible",
                    OpportunityType = OpportunityTypes.Vacancy,
                    EmploymentType = "office",
                    ModerationStatus = OpportunityModerationStatuses.Pending,
                    PublishAt = DateOnly.FromDateTime(DateTime.UtcNow),
                    ExpireAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                },
                new Opportunity
                {
                    EmployerId = profile.Id,
                    Title = "Deleted public opportunity",
                    Description = "Should not be visible",
                    OpportunityType = OpportunityTypes.Vacancy,
                    EmploymentType = "office",
                    ModerationStatus = OpportunityModerationStatuses.Approved,
                    DeletedAt = DateOnly.FromDateTime(DateTime.UtcNow),
                    PublishAt = DateOnly.FromDateTime(DateTime.UtcNow),
                    ExpireAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                });

            await db.SaveChangesAsync();
        }

        var response = await client.GetAsync($"/api/companies/{companyId}/opportunities");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var payload = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var opportunities = payload.RootElement.EnumerateArray().ToArray();

        Assert.NotEmpty(opportunities);
        Assert.All(opportunities, item =>
        {
            Assert.Equal(companyId, item.GetProperty("employerId").GetInt32());
            Assert.Equal("approved", item.GetProperty("moderationStatus").GetString());
            Assert.Equal(JsonValueKind.Null, item.GetProperty("deletedAt").ValueKind);
            Assert.True(item.TryGetProperty("salaryFrom", out _));
            Assert.True(item.TryGetProperty("salaryTo", out _));
            Assert.True(item.TryGetProperty("duration", out _));
        });
        Assert.DoesNotContain(opportunities, item => item.GetProperty("title").GetString() == "Pending public opportunity");
        Assert.DoesNotContain(opportunities, item => item.GetProperty("title").GetString() == "Deleted public opportunity");
    }

    [Fact]
    public async Task UpdateCompanyMe_PersistsNewMediaSections()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await LoginAsCompanyAsync(client);

        const string heroMediaJson = """{"type":"video","title":"Hero title","description":"Hero description","previewUrl":"https://example.com/hero.jpg","sourceUrl":"https://example.com/video"}""";
        const string caseStudiesJson = """[{"id":"case-1","title":"Case title","subtitle":"Subtitle","description":"Case description","mediaType":"image","previewUrl":"https://example.com/case.jpg","sourceUrl":"https://example.com/case"}]""";
        const string galleryJson = """[{"id":"gallery-1","alt":"Gallery image","imageUrl":"https://example.com/gallery.jpg"}]""";

        var updateResponse = await client.PutAsJsonAsync("/api/company/me", new
        {
            heroMediaJson,
            caseStudiesJson,
            galleryJson,
        });

        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);

        var payload = await updateResponse.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(payload);
        Assert.Equal(heroMediaJson, payload!.HeroMediaJson);
        Assert.Equal(caseStudiesJson, payload.CaseStudiesJson);
        Assert.Equal(galleryJson, payload.GalleryJson);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");

        Assert.Equal(heroMediaJson, profile.HeroMediaJson);
        Assert.Equal(caseStudiesJson, profile.CaseStudiesJson);
        Assert.Equal(galleryJson, profile.GalleryJson);
    }

    [Fact]
    public async Task UpdateCompanyMe_PreservesApprovedStatusForContentEditsAndMovesToRevisionForIdentityChanges()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        await LoginAsCompanyAsync(client);

        var contentResponse = await client.PutAsJsonAsync("/api/company/me", new
        {
            description = "Updated content only",
        });

        Assert.Equal(HttpStatusCode.OK, contentResponse.StatusCode);

        var contentPayload = await contentResponse.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(contentPayload);
        Assert.Equal("approved", contentPayload!.VerificationStatus);

        var identityResponse = await client.PutAsJsonAsync("/api/company/me", new
        {
            legalAddress = "Новосибирск, новый юридический адрес",
        });

        Assert.Equal(HttpStatusCode.OK, identityResponse.StatusCode);

        var identityPayload = await identityResponse.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(identityPayload);
        Assert.Equal("revision", identityPayload!.VerificationStatus);
    }

    [Fact]
    public async Task SubmitCompanyVerificationRequest_PersistsStructuredPayloadAndServesPrivateDocument()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();
        string expectedCompanyName;
        string? expectedLegalAddress;

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            expectedCompanyName = profile.CompanyName;
            expectedLegalAddress = profile.LegalAddress;
            profile.VerificationStatus = CompanyVerificationStatuses.Revision;
            profile.VerificationData = null;
            profile.VerificationMethod = null;
            await db.SaveChangesAsync();
        }

        await LoginAsCompanyAsync(client);

        using var formData = new MultipartFormDataContent();
        formData.Add(new StringContent("Ирина Смирнова", Encoding.UTF8), "contactName");
        formData.Add(new StringContent("HR Lead", Encoding.UTF8), "contactRole");
        formData.Add(new StringContent("+7 999 000-00-00", Encoding.UTF8), "contactPhone");
        formData.Add(new StringContent("hr@tramplin.local", Encoding.UTF8), "contactEmail");

        var documentContent = new ByteArrayContent("%PDF-1.4 verification".Select(static item => (byte)item).ToArray());
        documentContent.Headers.ContentType = new MediaTypeHeaderValue("application/pdf");
        formData.Add(documentContent, "document", "egrul.pdf");

        var submitResponse = await client.PostAsync("/api/company/me/verification-request", formData);
        Assert.Equal(HttpStatusCode.OK, submitResponse.StatusCode);

        var payload = await submitResponse.Content.ReadFromJsonAsync<CompanyProfileReadDTO>();
        Assert.NotNull(payload);
        Assert.Equal("pending", payload!.VerificationStatus);
        Assert.Equal("manual_document", payload.VerificationMethod);

        CompanyVerificationDataDTO? verificationData;
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");

            Assert.Equal("pending", profile.VerificationStatus);
            Assert.Equal("manual_document", profile.VerificationMethod);

            verificationData = JsonSerializer.Deserialize<CompanyVerificationDataDTO>(profile.VerificationData!);
        }

        Assert.NotNull(verificationData);
        Assert.Equal(expectedCompanyName, verificationData!.Snapshot?.CompanyName);
        Assert.Equal("7707083893", verificationData.Snapshot?.Inn);
        Assert.Equal(expectedLegalAddress, verificationData.Snapshot?.LegalAddress);
        Assert.Equal("Ирина Смирнова", verificationData.Contact?.Name);
        Assert.Equal("egrul.pdf", verificationData.Document?.OriginalName);
        Assert.False(string.IsNullOrWhiteSpace(verificationData.Document?.StorageKey));
        Assert.True(verificationData.SubmittedAt.HasValue);

        var downloadResponse = await client.GetAsync("/api/company/me/verification-document");
        Assert.Equal(HttpStatusCode.OK, downloadResponse.StatusCode);
        Assert.Equal("application/pdf", downloadResponse.Content.Headers.ContentType?.MediaType);
        Assert.Equal("%PDF-1.4 verification", await downloadResponse.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task SubmitCompanyVerificationRequest_ReturnsBadRequestForMissingDocument()
    {
        await using var factory = new TestApplicationFactory();
        using var client = factory.CreateClient();

        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
            var profile = await db.EmployerProfiles.SingleAsync(item => item.Inn == "7707083893");
            profile.VerificationStatus = CompanyVerificationStatuses.Revision;
            profile.VerificationData = null;
            await db.SaveChangesAsync();
        }

        await LoginAsCompanyAsync(client);

        using var formData = new MultipartFormDataContent();
        formData.Add(new StringContent("Ирина Смирнова", Encoding.UTF8), "contactName");
        formData.Add(new StringContent("HR Lead", Encoding.UTF8), "contactRole");
        formData.Add(new StringContent("+7 999 000-00-00", Encoding.UTF8), "contactPhone");
        formData.Add(new StringContent("hr@tramplin.local", Encoding.UTF8), "contactEmail");

        var response = await client.PostAsync("/api/company/me/verification-request", formData);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private static async Task LoginAsCompanyAsync(HttpClient client)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new
        {
            role = "company",
            login = "7707083893",
            password = "Demo1234",
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }
}
