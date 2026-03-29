namespace ITPlanetaTramplin.Api.Domain;

internal static class CandidateProfessionCatalog
{
    private static readonly ProfessionCatalogItem[] Items =
    [
        new("Веб-разработчик", ["web", "frontend", "backend", "fullstack", "разработчик"]),
        new("Frontend-разработчик", ["frontend", "react", "vue", "ui"]),
        new("Backend-разработчик", ["backend", "api", "server", "dotnet", "java", "python"]),
        new("Fullstack-разработчик", ["fullstack", "web", "frontend", "backend"]),
        new("Мобильный разработчик", ["mobile", "ios", "android", "flutter", "react native"]),
        new("Разработчик игр", ["gamedev", "unity", "unreal", "игры"]),
        new("DevOps-инженер", ["devops", "sre", "infra", "cloud", "kubernetes"]),
        new("QA-инженер", ["qa", "test", "testing", "автотест"]),
        new("Инженер по автоматизации тестирования", ["qa", "automation", "автотест"]),
        new("Системный администратор", ["admin", "linux", "windows", "network"]),
        new("Сетевой инженер", ["network", "сети", "infrastructure"]),
        new("Специалист по кибербезопасности", ["security", "soc", "pentest", "infosec"]),
        new("Аналитик данных", ["data analyst", "sql", "bi", "analytics"]),
        new("Дата-инженер", ["data engineer", "etl", "warehouse", "spark"]),
        new("Data Scientist", ["data science", "ml", "python", "analysis"]),
        new("ML-инженер", ["machine learning", "ml", "model", "ai"]),
        new("Продуктовый аналитик", ["product analytics", "metrics", "experiments"]),
        new("Системный аналитик", ["system analyst", "requirements", "bpmn"]),
        new("Бизнес-аналитик", ["business analyst", "requirements", "process"]),
        new("Продуктовый менеджер", ["product manager", "pm", "product"]),
        new("Проектный менеджер", ["project manager", "pm", "delivery"]),
        new("Scrum-мастер", ["scrum", "agile", "delivery"]),
        new("UX/UI-дизайнер", ["ux", "ui", "product design", "figma"]),
        new("Продуктовый дизайнер", ["product designer", "ux", "ui"]),
        new("Графический дизайнер", ["graphic", "brand", "illustration"]),
        new("Motion-дизайнер", ["motion", "after effects", "animation"]),
        new("3D-художник", ["3d", "modeling", "blender"]),
        new("Технический писатель", ["technical writer", "docs", "documentation"]),
        new("Специалист технической поддержки", ["support", "helpdesk", "customer support"]),
        new("Маркетолог digital-проектов", ["marketing", "digital", "performance"]),
        new("SEO/ASO-специалист", ["seo", "aso", "search"]),
        new("Контент-менеджер", ["content", "copy", "cms"]),
        new("Продюсер онлайн-курсов", ["edtech", "course", "producer"]),
        new("Рекрутер в IT", ["recruiter", "hr", "talent"]),
        new("HR-специалист", ["hr", "people", "recruitment"]),
        new("1C-разработчик", ["1c", "erp"]),
    ];

    public static IReadOnlyList<object> Search(string? query, int count)
    {
        var normalizedQuery = Normalize(query);
        var normalizedCount = Math.Clamp(count, 1, 30);

        var matches = string.IsNullOrWhiteSpace(normalizedQuery)
            ? Items
            : Items
                .Where(item => item.Matches(normalizedQuery))
                .ToArray();

        return matches
            .Take(normalizedCount)
            .Select(item => (object)new
            {
                value = item.Label,
                label = item.Label,
            })
            .ToList();
    }

    private static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() ?? string.Empty;

    private sealed record ProfessionCatalogItem(string Label, string[] Keywords)
    {
        public bool Matches(string normalizedQuery)
        {
            if (Normalize(Label).Contains(normalizedQuery, StringComparison.Ordinal))
            {
                return true;
            }

            return Keywords.Any(keyword => Normalize(keyword).Contains(normalizedQuery, StringComparison.Ordinal));
        }
    }
}
