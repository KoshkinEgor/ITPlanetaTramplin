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
    private const string DemoCuratorEmail = "demo-curator@tramplin.local";
    private const string DemoCuratorPassword = "Curator1234";

    private static readonly SeedCurator[] SeedCurators =
    [
        new(DemoCuratorEmail, DemoCuratorPassword, "Demo", "Curator", null),
        new("olga.curator@tramplin.local", "Moderator1234", "Olga", "Morozova", "Sergeevna"),
    ];

    private static readonly SeedCandidate[] SeedCandidates =
    [
        new(
            "anna.petrova@tramplin.local",
            "Candidate1234",
            "Anna",
            "Petrova",
            null,
            "Frontend engineer focused on component libraries, accessibility, and product iteration speed.",
            ["React", "TypeScript", "Accessibility", "Figma"],
            """{"portfolio":"https://anna.tramplin.local","github":"https://github.com/anna-petrova","telegram":"https://t.me/annapetrova"}"""),
        new(
            "ivan.smirnov@tramplin.local",
            "Analyst1234",
            "Ivan",
            "Smirnov",
            "Olegovich",
            "Product analyst who works with SQL, Python, dashboards, and experiment design for digital products.",
            ["SQL", "Python", "A/B testing", "Analytics"],
            """{"portfolio":"https://ivan.tramplin.local","github":"https://github.com/ivan-smirnov","telegram":"https://t.me/ivansmirnov"}"""),
        new(
            "polina.sokolova@tramplin.local",
            "Designer1234",
            "Polina",
            "Sokolova",
            null,
            "Product designer with strong research practice, prototyping skills, and a focus on internship programs.",
            ["Figma", "UX research", "Prototyping", "Design systems"],
            """{"portfolio":"https://polina.tramplin.local","behance":"https://behance.net/polina-sokolova","telegram":"https://t.me/polinasokolova"}"""),
    ];

    private static readonly SeedCompany[] SeedCompanies =
    [
        new(
            DemoCompanyEmail,
            DemoCompanyPassword,
            "Sber",
            "7707083893",
            "Moscow, Vavilova 19",
            "Large fintech and ecosystem company with teams in frontend, analytics, and digital product operations.",
            """[{"type":"website","url":"https://www.sberbank.com"},{"type":"telegram","url":"https://t.me/sberbank"}]""",
            [
                new(
                    "Junior Frontend Developer",
                    "Build candidate-facing interfaces in React, improve the shared UI layer, and ship product experiments together with mentors.",
                    "Moscow",
                    "Kutuzovsky prospekt 32",
                    "vacancy",
                    "Hybrid",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_it"}""",
                    ["React", "TypeScript", "Frontend", "Design systems"]),
                new(
                    "Product Analytics Internship",
                    "Prepare dashboards, validate product hypotheses, and support the weekly experiment review with analysts and PMs.",
                    "Moscow",
                    "Vavilova 19",
                    "internship",
                    "Office",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_analytics"}""",
                    ["Analytics", "SQL", "Dashboards", "A/B testing"]),
            ]),
        new(
            "company-vk@tramplin.local",
            "VkTeam1234",
            "VK",
            "7743001840",
            "Saint Petersburg, Khersonskaya 12-14",
            "Digital products for communication, content, and creator tools with active internship and meetup programs.",
            """[{"type":"website","url":"https://vk.company"},{"type":"telegram","url":"https://t.me/vkteam"}]""",
            [
                new(
                    "Product Design Internship",
                    "Work with product designers on research synthesis, rapid prototypes, and design QA for social and creator tools.",
                    "Saint Petersburg",
                    "Khersonskaya 12-14",
                    "internship",
                    "Office",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Figma", "UX research", "Prototyping", "Product design"]),
                new(
                    "Frontend Meetup Career Sprint",
                    "A live event with portfolio reviews, short interviews, and team sessions for students entering frontend roles.",
                    "Moscow",
                    "Leningradsky prospekt 39",
                    "event",
                    "On-site",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Frontend", "Career event", "Networking", "Community"]),
            ]),
        new(
            "company-yandex@tramplin.local",
            "Yandex1234",
            "Yandex",
            "7736207543",
            "Moscow, Lev Tolstoy 16",
            "Product company with strong engineering and design system culture across multiple digital services.",
            """[{"type":"website","url":"https://yandex.ru/jobs"},{"type":"telegram","url":"https://t.me/yandex"}]""",
            [
                new(
                    "Design Systems Engineer",
                    "Own token delivery, component API consistency, and the bridge between design kits and production-ready React code.",
                    "Moscow",
                    "Lev Tolstoy 16",
                    "vacancy",
                    "Remote",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Design systems", "React", "Accessibility", "Tokens"]),
                new(
                    "ML Product Analyst Internship",
                    "Support a product squad with metrics trees, dashboard automation, and experiment readouts for ML-powered features.",
                    "Moscow",
                    "Timura Frunze 11",
                    "internship",
                    "Hybrid",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Analytics", "Python", "SQL", "Machine learning"]),
            ]),
        new(
            "company-rostelecom@tramplin.local",
            "Rostelecom1234",
            "Rostelecom",
            "7707049388",
            "Moscow, Goncharnaya 30",
            "Telecom and platform company with B2B products, enterprise QA, and internal education programs.",
            """[{"type":"website","url":"https://www.company.rt.ru"},{"type":"telegram","url":"https://t.me/rostelecom"}]""",
            [
                new(
                    "B2B Platform QA Engineer",
                    "Test enterprise user journeys, automate smoke scenarios, and coordinate regression plans with the product team.",
                    "Moscow",
                    "Goncharnaya 30",
                    "vacancy",
                    "Hybrid",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["QA", "B2B", "Testing", "Automation"]),
                new(
                    "Network Automation Bootcamp",
                    "A short practice program on automation basics, observability, and infrastructure scripting for students.",
                    "Innopolis",
                    "Universitetskaya 1",
                    "event",
                    "On-site",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["DevOps", "Networking", "Automation", "Career event"]),
            ]),
    ];

    private static readonly SeedApplication[] SeedApplications =
    [
        new("anna.petrova@tramplin.local", "Junior Frontend Developer", OpportunityApplicationStatuses.Reviewing, "Portfolio looks strong. Preparing a technical interview."),
        new("anna.petrova@tramplin.local", "Design Systems Engineer", OpportunityApplicationStatuses.Submitted, null),
        new("ivan.smirnov@tramplin.local", "Product Analytics Internship", OpportunityApplicationStatuses.Invited, "Invite sent for the analytics case interview."),
        new("ivan.smirnov@tramplin.local", "ML Product Analyst Internship", OpportunityApplicationStatuses.Reviewing, "Please prepare examples of SQL dashboards."),
        new("polina.sokolova@tramplin.local", "Product Design Internship", OpportunityApplicationStatuses.Reviewing, "Need one more case study focused on research synthesis."),
        new("polina.sokolova@tramplin.local", "Frontend Meetup Career Sprint", OpportunityApplicationStatuses.Accepted, "Registration confirmed. See you at the event."),
    ];

    private static readonly SeedContact[] SeedContacts =
    [
        new("anna.petrova@tramplin.local", "polina.sokolova@tramplin.local"),
        new("ivan.smirnov@tramplin.local", "anna.petrova@tramplin.local"),
        new("polina.sokolova@tramplin.local", "anna.petrova@tramplin.local"),
    ];

    private static readonly SeedRecommendation[] SeedRecommendations =
    [
        new(
            "anna.petrova@tramplin.local",
            "polina.sokolova@tramplin.local",
            "Product Design Internship",
            "Polina is strong in research synthesis and fast prototyping, and she works well with engineers."),
        new(
            "polina.sokolova@tramplin.local",
            "anna.petrova@tramplin.local",
            "Design Systems Engineer",
            "Anna already thinks in components and tokens, and she can turn design specs into stable frontend patterns."),
    ];

    public static async Task SeedAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDBContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("DevelopmentDataSeeder");

        var curatorUsers = await EnsureCuratorsAsync(db, cancellationToken);
        var candidateUsers = await EnsureCandidatesAsync(db, cancellationToken);
        var companyUsers = await EnsureCompaniesAsync(db, cancellationToken);
        var tagsByName = await EnsureTagsAsync(db, cancellationToken);
        var opportunitiesByTitle = await EnsureOpportunitiesAsync(db, companyUsers, tagsByName, cancellationToken);

        await EnsureContactsAsync(db, candidateUsers, cancellationToken);
        await EnsureApplicationsAsync(db, candidateUsers, opportunitiesByTitle, cancellationToken);
        await EnsureRecommendationsAsync(db, candidateUsers, opportunitiesByTitle, cancellationToken);

        logger.LogInformation(
            "Development seed ensured {Curators} curators, {Candidates} candidates, {Companies} companies, and {Opportunities} opportunities.",
            curatorUsers.Count,
            candidateUsers.Count,
            companyUsers.Count,
            opportunitiesByTitle.Count);
    }

    private static async Task<List<User>> EnsureCuratorsAsync(ApplicationDBContext db, CancellationToken cancellationToken)
    {
        var users = new List<User>(SeedCurators.Length);

        foreach (var seedCurator in SeedCurators)
        {
            var normalizedEmail = AuthSupport.NormalizeEmail(seedCurator.Email);
            var user = await db.Users
                .Include(item => item.CuratorProfile)
                .FirstOrDefaultAsync(item => item.Email.ToLower() == normalizedEmail, cancellationToken);

            if (user is null)
            {
                user = new User
                {
                    Email = normalizedEmail,
                    CuratorProfile = new CuratorProfile(),
                };

                db.Users.Add(user);
            }

            user.Email = normalizedEmail;
            user.DeletedAt = null;
            user.IsVerified = true;
            user.PreVerify = true;
            user.PasswordHash = AuthSupport.HashPassword(user, seedCurator.Password);
            user.CuratorProfile ??= new CuratorProfile();
            user.CuratorProfile.Name = seedCurator.Name;
            user.CuratorProfile.Surname = seedCurator.Surname;
            user.CuratorProfile.Thirdname = seedCurator.Thirdname;
            users.Add(user);
        }

        await db.SaveChangesAsync(cancellationToken);
        return users;
    }

    private static async Task<List<User>> EnsureCandidatesAsync(ApplicationDBContext db, CancellationToken cancellationToken)
    {
        var users = new List<User>(SeedCandidates.Length);

        foreach (var seedCandidate in SeedCandidates)
        {
            var normalizedEmail = AuthSupport.NormalizeEmail(seedCandidate.Email);
            var user = await db.Users
                .Include(item => item.ApplicantProfile)
                .FirstOrDefaultAsync(item => item.Email.ToLower() == normalizedEmail, cancellationToken);

            if (user is null)
            {
                user = new User
                {
                    Email = normalizedEmail,
                    ApplicantProfile = new ApplicantProfile(),
                };

                db.Users.Add(user);
            }

            user.Email = normalizedEmail;
            user.DeletedAt = null;
            user.IsVerified = true;
            user.PreVerify = true;
            user.PasswordHash = AuthSupport.HashPassword(user, seedCandidate.Password);
            user.ApplicantProfile ??= new ApplicantProfile();
            user.ApplicantProfile.Name = seedCandidate.Name;
            user.ApplicantProfile.Surname = seedCandidate.Surname;
            user.ApplicantProfile.Thirdname = seedCandidate.Thirdname;
            user.ApplicantProfile.Description = seedCandidate.Description;
            user.ApplicantProfile.Skills = seedCandidate.Skills.ToList();
            user.ApplicantProfile.Links = seedCandidate.LinksJson;
            users.Add(user);
        }

        await db.SaveChangesAsync(cancellationToken);
        return users;
    }

    private static async Task<List<User>> EnsureCompaniesAsync(ApplicationDBContext db, CancellationToken cancellationToken)
    {
        var users = new List<User>(SeedCompanies.Length);

        foreach (var seedCompany in SeedCompanies)
        {
            var normalizedEmail = AuthSupport.NormalizeEmail(seedCompany.Email);
            var normalizedInn = AuthSupport.NormalizeInn(seedCompany.Inn);
            var user = await db.Users
                .Include(item => item.EmployerProfile)
                .FirstOrDefaultAsync(
                    item => item.Email.ToLower() == normalizedEmail ||
                        (item.EmployerProfile != null && item.EmployerProfile.Inn == normalizedInn),
                    cancellationToken);

            if (user is null)
            {
                user = new User
                {
                    Email = normalizedEmail,
                    EmployerProfile = new EmployerProfile(),
                };

                db.Users.Add(user);
            }

            user.Email = normalizedEmail;
            user.DeletedAt = null;
            user.IsVerified = true;
            user.PreVerify = true;
            user.PasswordHash = AuthSupport.HashPassword(user, seedCompany.Password);
            user.EmployerProfile ??= new EmployerProfile();
            user.EmployerProfile.CompanyName = seedCompany.CompanyName;
            user.EmployerProfile.Inn = normalizedInn;
            user.EmployerProfile.VerificationData = """{"source":"development-seed"}""";
            user.EmployerProfile.VerificationMethod = "seed";
            user.EmployerProfile.VerificationStatus = CompanyVerificationStatuses.Approved;
            user.EmployerProfile.LegalAddress = seedCompany.LegalAddress;
            user.EmployerProfile.Description = seedCompany.Description;
            user.EmployerProfile.Socials = seedCompany.SocialsJson;
            user.EmployerProfile.MediaContent = "[]";
            users.Add(user);
        }

        await db.SaveChangesAsync(cancellationToken);
        return users;
    }

    private static async Task<Dictionary<string, Tag>> EnsureTagsAsync(ApplicationDBContext db, CancellationToken cancellationToken)
    {
        var requiredTagNames = SeedCompanies
            .SelectMany(static company => company.Opportunities)
            .SelectMany(static opportunity => opportunity.TagNames)
            .Distinct(StringComparer.Ordinal)
            .ToArray();

        var tagsByName = await db.Tags
            .Where(item => requiredTagNames.Contains(item.Name))
            .ToDictionaryAsync(item => item.Name, StringComparer.Ordinal, cancellationToken);

        foreach (var tagName in requiredTagNames)
        {
            if (tagsByName.ContainsKey(tagName))
            {
                continue;
            }

            var tag = new Tag
            {
                Name = tagName,
                IsActive = true,
            };

            db.Tags.Add(tag);
            tagsByName[tagName] = tag;
        }

        await db.SaveChangesAsync(cancellationToken);
        return tagsByName;
    }

    private static async Task<Dictionary<string, Opportunity>> EnsureOpportunitiesAsync(
        ApplicationDBContext db,
        IReadOnlyCollection<User> companyUsers,
        IReadOnlyDictionary<string, Tag> tagsByName,
        CancellationToken cancellationToken)
    {
        var companyByInn = companyUsers
            .Where(item => item.EmployerProfile?.Inn is not null)
            .ToDictionary(item => item.EmployerProfile!.Inn!, StringComparer.Ordinal);
        var opportunitiesByTitle = new Dictionary<string, Opportunity>(StringComparer.Ordinal);

        foreach (var seedCompany in SeedCompanies)
        {
            if (!companyByInn.TryGetValue(AuthSupport.NormalizeInn(seedCompany.Inn), out var companyUser) ||
                companyUser.EmployerProfile is null)
            {
                throw new InvalidOperationException($"Company profile for INN {seedCompany.Inn} was not created.");
            }

            foreach (var seedOpportunity in seedCompany.Opportunities)
            {
                var opportunity = await db.Opportunities
                    .Include(item => item.Tags)
                    .FirstOrDefaultAsync(item => item.Title == seedOpportunity.Title, cancellationToken);

                if (opportunity is null)
                {
                    opportunity = new Opportunity();
                    db.Opportunities.Add(opportunity);
                }

                opportunity.EmployerId = companyUser.EmployerProfile.Id;
                opportunity.Title = seedOpportunity.Title;
                opportunity.Description = seedOpportunity.Description;
                opportunity.LocationCity = seedOpportunity.LocationCity;
                opportunity.LocationAddress = seedOpportunity.LocationAddress;
                opportunity.OpportunityType = seedOpportunity.OpportunityType;
                opportunity.EmploymentType = seedOpportunity.EmploymentType;
                opportunity.ModerationStatus = OpportunityModerationStatuses.Approved;
                opportunity.DeletedAt = null;
                opportunity.PublishAt = DateOnly.FromDateTime(DateTime.UtcNow);
                opportunity.ExpireAt = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2));
                opportunity.ContactsJson = seedOpportunity.ContactsJson;
                opportunity.MediaContentJson = "[]";
                opportunity.Tags = seedOpportunity.TagNames.Select(tagName => tagsByName[tagName]).ToList();

                opportunitiesByTitle[seedOpportunity.Title] = opportunity;
            }
        }

        await db.SaveChangesAsync(cancellationToken);
        return opportunitiesByTitle;
    }

    private static async Task EnsureContactsAsync(
        ApplicationDBContext db,
        IReadOnlyCollection<User> candidateUsers,
        CancellationToken cancellationToken)
    {
        var usersByEmail = candidateUsers.ToDictionary(item => item.Email, StringComparer.OrdinalIgnoreCase);

        foreach (var seedContact in SeedContacts)
        {
            if (!usersByEmail.TryGetValue(seedContact.OwnerEmail, out var owner) ||
                !usersByEmail.TryGetValue(seedContact.ContactEmail, out var contact) ||
                owner.Id == contact.Id)
            {
                continue;
            }

            var exists = await db.Contacts.AnyAsync(
                item => item.UserId == owner.Id && item.ContactProfileId == contact.Id,
                cancellationToken);

            if (exists)
            {
                continue;
            }

            db.Contacts.Add(new Contact
            {
                UserId = owner.Id,
                ContactProfileId = contact.Id,
            });
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureApplicationsAsync(
        ApplicationDBContext db,
        IReadOnlyCollection<User> candidateUsers,
        IReadOnlyDictionary<string, Opportunity> opportunitiesByTitle,
        CancellationToken cancellationToken)
    {
        var candidatesByEmail = candidateUsers
            .Where(item => item.ApplicantProfile is not null)
            .ToDictionary(item => item.Email, item => item.ApplicantProfile!, StringComparer.OrdinalIgnoreCase);

        foreach (var seedApplication in SeedApplications)
        {
            if (!candidatesByEmail.TryGetValue(seedApplication.CandidateEmail, out var candidateProfile) ||
                !opportunitiesByTitle.TryGetValue(seedApplication.OpportunityTitle, out var opportunity))
            {
                continue;
            }

            var application = await db.Applications
                .FirstOrDefaultAsync(
                    item => item.ApplicantId == candidateProfile.Id && item.OpportunityId == opportunity.Id,
                    cancellationToken);

            if (application is null)
            {
                application = new OpportunityApplication
                {
                    ApplicantId = candidateProfile.Id,
                    OpportunityId = opportunity.Id,
                    AppliedAt = DateTime.UtcNow,
                };

                db.Applications.Add(application);
            }

            application.Status = OpportunityApplicationStatuses.Normalize(seedApplication.Status);
            application.EmployerNote = seedApplication.EmployerNote;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task EnsureRecommendationsAsync(
        ApplicationDBContext db,
        IReadOnlyCollection<User> candidateUsers,
        IReadOnlyDictionary<string, Opportunity> opportunitiesByTitle,
        CancellationToken cancellationToken)
    {
        var candidatesByEmail = candidateUsers
            .Where(item => item.ApplicantProfile is not null)
            .ToDictionary(item => item.Email, item => item.ApplicantProfile!, StringComparer.OrdinalIgnoreCase);

        foreach (var seedRecommendation in SeedRecommendations)
        {
            if (!candidatesByEmail.TryGetValue(seedRecommendation.RecommenderEmail, out var recommender) ||
                !candidatesByEmail.TryGetValue(seedRecommendation.CandidateEmail, out var candidate) ||
                !opportunitiesByTitle.TryGetValue(seedRecommendation.OpportunityTitle, out var opportunity))
            {
                continue;
            }

            var recommendation = await db.Recommendations
                .FirstOrDefaultAsync(
                    item =>
                        item.RecommenderId == recommender.Id &&
                        item.CandidateId == candidate.Id &&
                        item.OpportunityId == opportunity.Id,
                    cancellationToken);

            if (recommendation is null)
            {
                recommendation = new Recommendation
                {
                    RecommenderId = recommender.Id,
                    CandidateId = candidate.Id,
                    OpportunityId = opportunity.Id,
                    CreatedAt = DateTime.UtcNow,
                };

                db.Recommendations.Add(recommendation);
            }

            recommendation.Message = seedRecommendation.Message;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private sealed record SeedCurator(string Email, string Password, string Name, string Surname, string? Thirdname);

    private sealed record SeedCandidate(
        string Email,
        string Password,
        string Name,
        string Surname,
        string? Thirdname,
        string Description,
        string[] Skills,
        string LinksJson);

    private sealed record SeedCompany(
        string Email,
        string Password,
        string CompanyName,
        string Inn,
        string LegalAddress,
        string Description,
        string SocialsJson,
        SeedOpportunity[] Opportunities);

    private sealed record SeedOpportunity(
        string Title,
        string Description,
        string LocationCity,
        string LocationAddress,
        string OpportunityType,
        string EmploymentType,
        string ContactsJson,
        string[] TagNames);

    private sealed record SeedApplication(string CandidateEmail, string OpportunityTitle, string Status, string? EmployerNote);

    private sealed record SeedContact(string OwnerEmail, string ContactEmail);

    private sealed record SeedRecommendation(string RecommenderEmail, string CandidateEmail, string OpportunityTitle, string Message);
}
