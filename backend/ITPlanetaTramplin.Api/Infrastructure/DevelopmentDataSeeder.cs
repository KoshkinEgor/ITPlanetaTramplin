using Application.DBContext;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Infrastructure;

internal static class DevelopmentDataSeeder
{
    private const string DemoCompanyEmail = "demo-company@tramplin.local";
    private const string DemoCompanyPassword = "Demo1234";
    private const string DemoCuratorEmail = "demo-curator@tramplin.local";
    private const string DemoCuratorPassword = "Curator1234";

    private static readonly SeedCurator[] SeedCurators =
    [
        new(DemoCuratorEmail, DemoCuratorPassword, "Demo", "Curator", null, false),
        new("olga.curator@tramplin.local", "Moderator1234", "Olga", "Morozova", "Sergeevna", false),
        new("administrator@tramplin.local", "Administrator1234", "administrator", string.Empty, null, true),
    ];

    private static readonly SeedCandidate[] SeedCandidates =
    [
        new(
            "anna.petrova@tramplin.local",
            "Candidate1234",
            "Anna",
            "Petrova",
            null,
            "Frontend-разработчик с фокусом на библиотеки компонентов, доступность и быстрые продуктовые итерации.",
            ["React", "TypeScript", "Accessibility", "Figma"],
            """{"portfolio":"https://anna.tramplin.local","github":"https://github.com/anna-petrova","telegram":"https://t.me/annapetrova"}""",
            CandidateModerationStatuses.Approved),
        new(
            "ivan.smirnov@tramplin.local",
            "Analyst1234",
            "Ivan",
            "Smirnov",
            "Olegovich",
            "Продуктовый аналитик, который работает с SQL, Python, дашбордами и дизайном экспериментов для цифровых продуктов.",
            ["SQL", "Python", "A/B testing", "Analytics"],
            """{"portfolio":"https://ivan.tramplin.local","github":"https://github.com/ivan-smirnov","telegram":"https://t.me/ivansmirnov"}""",
            CandidateModerationStatuses.Approved),
        new(
            "polina.sokolova@tramplin.local",
            "Designer1234",
            "Polina",
            "Sokolova",
            null,
            "Продуктовый дизайнер с сильной исследовательской базой, навыками прототипирования и интересом к стажировочным программам.",
            ["Figma", "UX research", "Prototyping", "Design systems"],
            """{"portfolio":"https://polina.tramplin.local","behance":"https://behance.net/polina-sokolova","telegram":"https://t.me/polinasokolova"}""",
            CandidateModerationStatuses.Approved),
    ];

    private static readonly SeedCompany[] SeedCompanies =
    [
        new(
            DemoCompanyEmail,
            DemoCompanyPassword,
            "Sber",
            "7707083893",
            "Москва, улица Вавилова, 19",
            "Крупная финтех- и экосистемная компания с командами во frontend, аналитике и цифровых продуктах.",
            """[{"type":"website","url":"https://www.sberbank.com"},{"type":"telegram","url":"https://t.me/sberbank"}]""",
            [
                new(
                    "Младший frontend-разработчик",
                    "Развивайте интерфейсы для кандидатов на React, улучшайте общий UI-слой и выпускайте продуктовые эксперименты вместе с наставниками.",
                    "Москва",
                    "Кутузовский проспект, 32",
                    55.7404364m,
                    37.5320564m,
                    "vacancy",
                    "Hybrid",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_it"}""",
                    ["React", "TypeScript", "Frontend", "Design systems"]),
                new(
                    "Стажировка по продуктовой аналитике",
                    "Готовьте дашборды, проверяйте продуктовые гипотезы и поддерживайте еженедельные разборы экспериментов с аналитиками и продакт-менеджерами.",
                    "Москва",
                    "улица Вавилова, 19",
                    55.6999417m,
                    37.5802003m,
                    "internship",
                    "Office",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_analytics"}""",
                    ["Analytics", "SQL", "Dashboards", "A/B testing"]),
                new(
                    "Sber Start: frontend-стажировка в Чебоксарах",
                    "Помогайте продуктовой команде с React-фичами, исправлениями по доступности и задачами в общем UI-слое под руководством наставника.",
                    "Чебоксары",
                    "Президентский бульвар 27",
                    56.1336571m,
                    47.2431601m,
                    "internship",
                    "Hybrid",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_it"}""",
                    ["React", "TypeScript", "Frontend", "Accessibility"]),
                new(
                    "Карьерный уикенд Сбера в Чебоксарах",
                    "Открытое карьерное мероприятие с разбором резюме, демо продуктов и мини-собеседованиями для студентов и junior-специалистов.",
                    "Чебоксары",
                    "улица Карла Маркса 52",
                    56.1338255m,
                    47.2458999m,
                    "event",
                    "Office",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_it"}""",
                    ["Career event", "Networking", "Students", "Frontend"]),
                new(
                    "Менторская программа Sber Frontend",
                    "Практический формат с еженедельными созвонами, code review и персональным планом роста для junior frontend-специалистов.",
                    "Москва",
                    "улица Вавилова, 19",
                    55.7002000m,
                    37.5803000m,
                    OpportunityTypes.Mentoring,
                    "Remote",
                    """{"email":"demo-company@tramplin.local","telegram":"@sber_it"}""",
                    ["Mentoring", "Frontend", "React", "Career growth"]),
            ]),
        new(
            "company-vk@tramplin.local",
            "VkTeam1234",
            "VK",
            "7743001840",
            "Санкт-Петербург, Херсонская улица, 12-14",
            "Цифровые продукты для коммуникаций, контента и creator tools с активными стажировками и карьерными событиями.",
            """[{"type":"website","url":"https://vk.company"},{"type":"telegram","url":"https://t.me/vkteam"}]""",
            [
                new(
                    "Стажировка по продуктовому дизайну",
                    "Работайте с продуктовой командой над синтезом исследований, быстрыми прототипами и дизайн-QA для социальных и creator-инструментов.",
                    "Санкт-Петербург",
                    "Херсонская улица, 12-14",
                    59.9287716m,
                    30.3810912m,
                    "internship",
                    "Office",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Figma", "UX research", "Prototyping", "Product design"]),
                new(
                    "Карьерный frontend-митап VK",
                    "Очное мероприятие с разбором портфолио, короткими интервью и сессиями с командами для студентов, входящих во frontend.",
                    "Москва",
                    "Ленинградский проспект, 39",
                    55.7954980m,
                    37.5370241m,
                    "event",
                    "On-site",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Frontend", "Career event", "Networking", "Community"]),
                new(
                    "Стажировка VK Mini Apps Frontend",
                    "Делайте интерфейсные эксперименты для mini apps, работайте с дизайн-токенами и подключайтесь к еженедельным code review.",
                    "Чебоксары",
                    "проспект Ленина 2",
                    56.1308549m,
                    47.2463442m,
                    "internship",
                    "Hybrid",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Frontend", "React", "Mini Apps", "Design systems"]),
                new(
                    "Специалист по QA контентных сценариев VK",
                    "Проверяйте пользовательские сценарии, валидируйте потоки публикации и документируйте баги в контентных и creator-инструментах.",
                    "Чебоксары",
                    "Московский проспект 17",
                    56.1450902m,
                    47.2229468m,
                    "vacancy",
                    "Office",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["QA", "Content", "Testing", "Community"]),
                new(
                    "День разбора портфолио VK в Чебоксарах",
                    "Однодневное событие с разбором портфолио, дизайн-критикой и Q&A с рекрутерами для студентов и junior-специалистов.",
                    "Чебоксары",
                    "проспект Максима Горького 10",
                    56.1497550m,
                    47.1972350m,
                    "event",
                    "Office",
                    """{"email":"company-vk@tramplin.local","telegram":"@vkcareers"}""",
                    ["Product design", "Career event", "Networking", "Community"]),
            ]),
        new(
            "company-yandex@tramplin.local",
            "Yandex1234",
            "Yandex",
            "7736207543",
            "Москва, улица Льва Толстого, 16",
            "Продуктовая компания с сильной инженерной культурой и развитой design systems-практикой в нескольких цифровых сервисах.",
            """[{"type":"website","url":"https://yandex.ru/jobs"},{"type":"telegram","url":"https://t.me/yandex"}]""",
            [
                new(
                    "Инженер дизайн-систем",
                    "Отвечайте за поставку токенов, консистентность API компонентов и связку между дизайн-китом и production-ready React-кодом.",
                    "Москва",
                    "улица Льва Толстого, 16",
                    55.7343105m,
                    37.5881791m,
                    "vacancy",
                    "Remote",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Design systems", "React", "Accessibility", "Tokens"]),
                new(
                    "Стажировка ML-продуктового аналитика",
                    "Поддерживайте продуктовую команду через деревья метрик, автоматизацию дашбордов и разбор результатов экспериментов для ML-функций.",
                    "Москва",
                    "улица Тимура Фрунзе, 11",
                    55.7361712m,
                    37.5854545m,
                    "internship",
                    "Hybrid",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Analytics", "Python", "SQL", "Machine learning"]),
                new(
                    "Аналитик контента Яндекс Карт",
                    "Готовьте датасеты, проверяйте изменения в картографическом контенте и работайте с Python-ноутбуками для улучшения локальных сервисов.",
                    "Чебоксары",
                    "улица Университетская 38",
                    56.1327573m,
                    47.1638830m,
                    "vacancy",
                    "Hybrid",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Analytics", "Python", "Maps", "SQL"]),
                new(
                    "Стажировка по качеству поиска Яндекса",
                    "Присоединяйтесь к команде оценки качества, анализируйте поисковую выдачу, размечайте сложные кейсы и автоматизируйте рутинные проверки на Python.",
                    "Чебоксары",
                    "проспект Тракторостроителей 1/34",
                    56.0986932m,
                    47.2851025m,
                    "internship",
                    "Office",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Python", "Analytics", "Search", "Machine learning"]),
                new(
                    "Продуктовый митап Яндекса в Чебоксарах",
                    "Региональный митап с докладами о ML-продуктах, карьерных траекториях для junior-специалистов и живым менторством от команд Яндекса.",
                    "Чебоксары",
                    "Президентский бульвар 20",
                    56.1354095m,
                    47.2403750m,
                    "event",
                    "Office",
                    """{"email":"company-yandex@tramplin.local","telegram":"@yandex_jobs"}""",
                    ["Career event", "Machine learning", "Networking", "Community"]),
            ]),
        new(
            "company-rostelecom@tramplin.local",
            "Rostelecom1234",
            "Rostelecom",
            "7707049388",
            "Москва, Гончарная улица, 30",
            "Телеком- и платформенная компания с B2B-продуктами, enterprise-QA и внутренними образовательными программами.",
            """[{"type":"website","url":"https://www.company.rt.ru"},{"type":"telegram","url":"https://t.me/rostelecom"}]""",
            [
                new(
                    "QA-инженер B2B-платформы",
                    "Тестируйте enterprise-сценарии пользователей, автоматизируйте smoke-проверки и координируйте регрессионные планы с продуктовой командой.",
                    "Москва",
                    "Гончарная улица, 30",
                    55.7424808m,
                    37.6474311m,
                    "vacancy",
                    "Hybrid",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["QA", "B2B", "Testing", "Automation"]),
                new(
                    "Буткемп по автоматизации сетей",
                    "Короткая практическая программа по основам автоматизации, observability и инфраструктурного скриптинга для студентов.",
                    "Иннополис",
                    "Университетская улица, 1",
                    55.7537907m,
                    48.7432258m,
                    "event",
                    "On-site",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["DevOps", "Networking", "Automation", "Career event"]),
                new(
                    "Лаборатория сетевой автоматизации Ростелекома в Чебоксарах",
                    "Практическая программа для студентов, которым интересны сетевой скриптинг, мониторинг и основы надежности инфраструктуры.",
                    "Чебоксары",
                    "улица Гагарина 25",
                    56.1210202m,
                    47.2439332m,
                    "internship",
                    "Office",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["DevOps", "Networking", "Automation", "Students"]),
                new(
                    "Младший инженер поддержки B2B в Чебоксарах",
                    "Поддерживайте корпоративных клиентов, разбирайте инциденты цифровых сервисов и работайте вместе с QA- и operations-командами.",
                    "Чебоксары",
                    "Марпосадское шоссе 14",
                    56.1268259m,
                    47.3234236m,
                    "vacancy",
                    "Hybrid",
                    """{"email":"company-rostelecom@tramplin.local","telegram":"@rtcareer"}""",
                    ["B2B", "Support", "Operations", "QA"]),
            ]),
    ];

    private static readonly SeedApplication[] SeedApplications =
    [
        new("anna.petrova@tramplin.local", "Младший frontend-разработчик", OpportunityApplicationStatuses.Reviewing, "Портфолио выглядит сильно. Готовим техническое интервью."),
        new("anna.petrova@tramplin.local", "Инженер дизайн-систем", OpportunityApplicationStatuses.Submitted, null),
        new("ivan.smirnov@tramplin.local", "Стажировка по продуктовой аналитике", OpportunityApplicationStatuses.Invited, "Отправили приглашение на кейс-интервью по аналитике."),
        new("ivan.smirnov@tramplin.local", "Стажировка ML-продуктового аналитика", OpportunityApplicationStatuses.Reviewing, "Подготовьте, пожалуйста, примеры SQL-дашбордов."),
        new("polina.sokolova@tramplin.local", "Стажировка по продуктовому дизайну", OpportunityApplicationStatuses.Reviewing, "Нужен еще один кейс с фокусом на синтез исследований."),
        new("polina.sokolova@tramplin.local", "Карьерный frontend-митап VK", OpportunityApplicationStatuses.Accepted, "Регистрация подтверждена. Увидимся на мероприятии."),
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
            "Стажировка по продуктовому дизайну",
            "Полина сильна в синтезе исследований и быстром прототипировании, а еще отлично работает с инженерами."),
        new(
            "polina.sokolova@tramplin.local",
            "anna.petrova@tramplin.local",
            "Инженер дизайн-систем",
            "Анна уже мыслит компонентами и токенами и умеет превращать дизайн-спеки в устойчивые frontend-паттерны."),
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
            user.CuratorProfile.IsAdministrator = seedCurator.IsAdministrator;
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
            user.ApplicantProfile.ModerationStatus = CandidateModerationStatuses.Normalize(seedCandidate.ModerationStatus);
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
            user.EmployerProfile.HeroMediaJson = BuildHeroMediaJson(seedCompany);
            user.EmployerProfile.CaseStudiesJson = BuildCaseStudiesJson(seedCompany);
            user.EmployerProfile.GalleryJson = BuildGalleryJson(seedCompany);
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

            var existingCompanyOpportunities = await db.Opportunities
                .Include(item => item.Applications)
                .Include(item => item.Recommendations)
                .Include(item => item.Tags)
                .Where(item => item.EmployerId == companyUser.EmployerProfile.Id)
                .ToListAsync(cancellationToken);

            foreach (var existingOpportunity in existingCompanyOpportunities)
            {
                existingOpportunity.Tags.Clear();
            }

            db.Applications.RemoveRange(existingCompanyOpportunities.SelectMany(item => item.Applications));
            db.Recommendations.RemoveRange(existingCompanyOpportunities.SelectMany(item => item.Recommendations));
            db.Opportunities.RemoveRange(existingCompanyOpportunities);
            await db.SaveChangesAsync(cancellationToken);

            foreach (var seedOpportunity in seedCompany.Opportunities)
            {
                var opportunity = new Opportunity();
                db.Opportunities.Add(opportunity);

                opportunity.EmployerId = companyUser.EmployerProfile.Id;
                opportunity.Title = seedOpportunity.Title;
                opportunity.Description = seedOpportunity.Description;
                opportunity.LocationCity = seedOpportunity.LocationCity;
                opportunity.LocationAddress = seedOpportunity.LocationAddress;
                opportunity.Latitude = seedOpportunity.Latitude;
                opportunity.Longitude = seedOpportunity.Longitude;
                opportunity.OpportunityType = OpportunityTypes.Normalize(seedOpportunity.OpportunityType) ?? OpportunityTypes.Vacancy;
                opportunity.EmploymentType = seedOpportunity.EmploymentType;
                opportunity.ModerationStatus = OpportunityModerationStatuses.Approved;
                opportunity.ModerationReason = null;
                opportunity.DeletedAt = null;
                opportunity.PublishAt = DateOnly.FromDateTime(DateTime.UtcNow);
                opportunity.ExpireAt = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(2));
                opportunity.ContactsJson = seedOpportunity.ContactsJson;
                opportunity.MediaContentJson = "[]";
                ApplySeedTypedFields(opportunity, seedOpportunity);
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

    private static string BuildHeroMediaJson(SeedCompany seedCompany) =>
        JsonSerializer.Serialize(new
        {
            type = "image",
            title = $"Команда {seedCompany.CompanyName}",
            description = seedCompany.Description,
            previewUrl = $"https://images.unsplash.com/photo-{GetHeroMediaImageId(seedCompany.CompanyName)}?auto=format&fit=crop&w=1600&q=80",
            sourceUrl = $"https://{seedCompany.CompanyName.ToLowerInvariant()}.tramplin.local/about",
        });

    private static string BuildCaseStudiesJson(SeedCompany seedCompany) =>
        JsonSerializer.Serialize(
            seedCompany.Opportunities
                .Take(3)
                .Select((opportunity, index) => new
                {
                    id = $"{seedCompany.CompanyName.ToLowerInvariant()}-case-{index + 1}",
                    title = opportunity.Title,
                    subtitle = opportunity.LocationCity,
                    description = opportunity.Description,
                    mediaType = "image",
                    previewUrl = $"https://images.unsplash.com/photo-{GetCaseStudyImageId(seedCompany.CompanyName, index)}?auto=format&fit=crop&w=1200&q=80",
                    sourceUrl = $"https://{seedCompany.CompanyName.ToLowerInvariant()}.tramplin.local/cases/{index + 1}",
                }));

    private static string BuildGalleryJson(SeedCompany seedCompany) =>
        JsonSerializer.Serialize(
            Enumerable.Range(1, 4)
                .Select(index => new
                {
                    id = $"{seedCompany.CompanyName.ToLowerInvariant()}-gallery-{index}",
                    alt = $"{seedCompany.CompanyName} gallery {index}",
                    imageUrl = $"https://images.unsplash.com/photo-{GetGalleryImageId(seedCompany.CompanyName, index)}?auto=format&fit=crop&w=1200&q=80",
                }));

    private static string GetHeroMediaImageId(string companyName) =>
        companyName switch
        {
            "Sber" => "1520607162513-77705c0f0d4a",
            "VK" => "1516321318423-f06f85e504b3",
            "Yandex" => "1497366754035-f200968a6e72",
            _ => "1521737604893-d14cc237f11d",
        };

    private static string GetCaseStudyImageId(string companyName, int index) =>
        (companyName, index) switch
        {
            ("Sber", 0) => "1516321497487-e288fb19713f",
            ("Sber", 1) => "1516321318423-f06f85e504b3",
            ("Sber", 2) => "1552664730-d307ca884978",
            ("VK", 0) => "1498050108023-c5249f4df085",
            ("VK", 1) => "1522071820081-009f0129c71c",
            ("VK", 2) => "1516321165247-4aa89a48be28",
            ("Yandex", 0) => "1497366412874-3415097a27e7",
            ("Yandex", 1) => "1524758631624-e2822e304c36",
            ("Yandex", 2) => "1517245386807-bb43f82c33c4",
            _ => "1521737604893-d14cc237f11d",
        };

    private static string GetGalleryImageId(string companyName, int index) =>
        (companyName, index) switch
        {
            ("Sber", 1) => "1516321497487-e288fb19713f",
            ("Sber", 2) => "1520607162513-77705c0f0d4a",
            ("Sber", 3) => "1552664730-d307ca884978",
            ("Sber", 4) => "1497366754035-f200968a6e72",
            ("VK", 1) => "1516321318423-f06f85e504b3",
            ("VK", 2) => "1498050108023-c5249f4df085",
            ("VK", 3) => "1522071820081-009f0129c71c",
            ("VK", 4) => "1516321165247-4aa89a48be28",
            ("Yandex", 1) => "1497366412874-3415097a27e7",
            ("Yandex", 2) => "1524758631624-e2822e304c36",
            ("Yandex", 3) => "1517245386807-bb43f82c33c4",
            ("Yandex", 4) => "1519389950473-47ba0277781c",
            _ => "1521737604893-d14cc237f11d",
        };

    private sealed record SeedCurator(string Email, string Password, string Name, string Surname, string? Thirdname, bool IsAdministrator);

    private sealed record SeedCandidate(
        string Email,
        string Password,
        string Name,
        string Surname,
        string? Thirdname,
        string Description,
        string[] Skills,
        string LinksJson,
        string ModerationStatus);

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
        decimal? Latitude,
        decimal? Longitude,
        string OpportunityType,
        string EmploymentType,
        string ContactsJson,
        string[] TagNames);

    private static void ApplySeedTypedFields(Opportunity opportunity, SeedOpportunity seedOpportunity)
    {
        var opportunityType = OpportunityTypes.Normalize(seedOpportunity.OpportunityType) ?? OpportunityTypes.Vacancy;

        if (opportunityType == OpportunityTypes.Vacancy)
        {
            opportunity.SalaryFrom = 80000;
            opportunity.SalaryTo = 150000;
            return;
        }

        if (opportunityType == OpportunityTypes.Internship)
        {
            opportunity.IsPaid = true;
            opportunity.Duration = "3 months";
            opportunity.StipendFrom = 30000;
            opportunity.StipendTo = 50000;
            return;
        }

        if (opportunityType == OpportunityTypes.Event)
        {
            opportunity.EventStartAt = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30));
            opportunity.RegistrationDeadline = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(20));
            return;
        }

        if (opportunityType == OpportunityTypes.Mentoring)
        {
            opportunity.Duration = "8 weeks";
            opportunity.MeetingFrequency = "Weekly";
            opportunity.SeatsCount = 5;
        }
    }

    private sealed record SeedApplication(string CandidateEmail, string OpportunityTitle, string Status, string? EmployerNote);

    private sealed record SeedContact(string OwnerEmail, string ContactEmail);

    private sealed record SeedRecommendation(string RecommenderEmail, string CandidateEmail, string OpportunityTitle, string Message);
}
