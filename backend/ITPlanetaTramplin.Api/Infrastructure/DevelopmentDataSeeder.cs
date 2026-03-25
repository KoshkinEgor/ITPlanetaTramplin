using Application.DBContext;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Models;

namespace ITPlanetaTramplin.Api.Infrastructure;

internal static class DevelopmentDataSeeder
{
    private const string DemoCompanyEmail = "demo-company@tramplin.local";
    private const string DemoCompanyPassword = "Demo1234";

    private static readonly SeedOpportunity[] SeedOpportunities =
    [
        new(
            "Junior Frontend Developer",
            "Ship candidate-facing UI in React, maintain shared components, and work with mentors on product iterations.",
            "Moscow",
            "Bolshaya Novodmitrovskaya 36",
            "vacancy",
            "Hybrid",
            ["React", "TypeScript", "Design systems"]),
        new(
            "Product Design Internship",
            "Join the design team for a three-month internship focused on research synthesis, rapid prototyping, and design QA.",
            "Kazan",
            "Peterburgskaya 52",
            "internship",
            "Office",
            ["Figma", "UX research", "Prototyping"]),
        new(
            "Frontend Meetup Career Sprint",
            "A live event with product teams, portfolio reviews, and short interviews for students entering frontend roles.",
            "Saint Petersburg",
            "Ligovsky prospekt 74",
            "event",
            "On-site",
            ["Frontend", "Career event", "Networking"]),
        new(
            "Design Systems Engineer",
            "Own token delivery, component API consistency, and the bridge between design kits and production-ready React code.",
            "Yekaterinburg",
            "Gorkogo 7A",
            "vacancy",
            "Remote",
            ["Design systems", "React", "Accessibility"]),
    ];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DevelopmentDataSeeder");

        var approvedOpportunitiesCount = await db.Opportunities
            .CountAsync(
                item => item.DeletedAt == null && item.ModerationStatus == OpportunityModerationStatuses.Approved,
                cancellationToken);

        if (approvedOpportunitiesCount > 0)
        {
            logger.LogInformation("Development seed skipped because approved opportunities already exist.");
            return;
        }

        var companyUser = await db.Users
            .Include(item => item.EmployerProfile)
            .FirstOrDefaultAsync(item => item.Email == DemoCompanyEmail, cancellationToken);

        if (companyUser is null)
        {
            companyUser = new User
            {
                Email = DemoCompanyEmail,
                IsVerified = true,
                EmployerProfile = new EmployerProfile
                {
                    CompanyName = "Tramplin Labs",
                    Inn = "7707083893",
                    VerificationMethod = "seed",
                    VerificationStatus = CompanyVerificationStatuses.Approved,
                    LegalAddress = "Moscow, Presnenskaya emb. 10",
                    Description = "Seeded demo company used to populate the public catalog in local development.",
                },
            };

            companyUser.PasswordHash = AuthSupport.HashPassword(companyUser, DemoCompanyPassword);
            db.Users.Add(companyUser);
            await db.SaveChangesAsync(cancellationToken);
        }
        else
        {
            companyUser.IsVerified = true;
            companyUser.PasswordHash = string.IsNullOrWhiteSpace(companyUser.PasswordHash)
                ? AuthSupport.HashPassword(companyUser, DemoCompanyPassword)
                : companyUser.PasswordHash;

            companyUser.EmployerProfile ??= new EmployerProfile
            {
                CompanyName = "Tramplin Labs",
                Inn = "7707083893",
                VerificationMethod = "seed",
                LegalAddress = "Moscow, Presnenskaya emb. 10",
                Description = "Seeded demo company used to populate the public catalog in local development.",
            };

            companyUser.EmployerProfile.VerificationStatus = CompanyVerificationStatuses.Approved;
            companyUser.EmployerProfile.CompanyName ??= "Tramplin Labs";
            companyUser.EmployerProfile.VerificationMethod ??= "seed";
            companyUser.EmployerProfile.LegalAddress ??= "Moscow, Presnenskaya emb. 10";
            companyUser.EmployerProfile.Description ??= "Seeded demo company used to populate the public catalog in local development.";

            await db.SaveChangesAsync(cancellationToken);
        }

        var requiredTagNames = SeedOpportunities
            .SelectMany(static opportunity => opportunity.TagNames)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var existingTags = await db.Tags
            .Where(item => requiredTagNames.Contains(item.Name))
            .ToDictionaryAsync(item => item.Name, cancellationToken);

        foreach (var tagName in requiredTagNames)
        {
            if (existingTags.ContainsKey(tagName))
            {
                continue;
            }

            var tag = new Tag
            {
                Name = tagName,
                IsActive = true,
            };

            db.Tags.Add(tag);
            existingTags[tagName] = tag;
        }

        await db.SaveChangesAsync(cancellationToken);

        var employerProfileId = companyUser.EmployerProfile?.Id;
        if (employerProfileId is null)
        {
            throw new InvalidOperationException("Demo company profile was not created.");
        }

        foreach (var seedOpportunity in SeedOpportunities)
        {
            var exists = await db.Opportunities.AnyAsync(item => item.Title == seedOpportunity.Title, cancellationToken);
            if (exists)
            {
                continue;
            }

            db.Opportunities.Add(new Opportunity
            {
                EmployerId = employerProfileId.Value,
                Title = seedOpportunity.Title,
                Description = seedOpportunity.Description,
                LocationCity = seedOpportunity.LocationCity,
                LocationAddress = seedOpportunity.LocationAddress,
                OpportunityType = seedOpportunity.OpportunityType,
                EmploymentType = seedOpportunity.EmploymentType,
                ModerationStatus = OpportunityModerationStatuses.Approved,
                PublishAt = DateOnly.FromDateTime(DateTime.UtcNow),
                ExpireAt = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2)),
                ContactsJson = """{"email":"demo-company@tramplin.local","telegram":"@tramplinlabs"}""",
                MediaContentJson = "[]",
                Tags = seedOpportunity.TagNames.Select(tagName => existingTags[tagName]).ToList(),
            });
        }

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation(
            "Seeded development catalog opportunities for {Email}. Use password {Password} for the demo company account.",
            DemoCompanyEmail,
            DemoCompanyPassword);
    }

    private sealed record SeedOpportunity(
        string Title,
        string Description,
        string LocationCity,
        string LocationAddress,
        string OpportunityType,
        string EmploymentType,
        string[] TagNames);
}
