namespace ITPlanetaTramplin.Api.Domain;

internal static class CandidateInstitutionCatalog
{
    private static readonly InstitutionCatalogItem[] Items =
    [
        new("Чувашский государственный университет им. И.Н. Ульянова", ["чгу", "ульянова", "чебоксары"]),
        new("Московский государственный университет им. М.В. Ломоносова", ["мгу", "ломоносова", "москва"]),
        new("Московский государственный технический университет им. Н.Э. Баумана", ["мгту", "баумана", "москва"]),
        new("Национальный исследовательский университет «Высшая школа экономики»", ["вшэ", "вышка", "экономики", "москва"]),
        new("Санкт-Петербургский государственный университет", ["спбгу", "петербургский", "санкт-петербург"]),
        new("Санкт-Петербургский национальный исследовательский университет информационных технологий, механики и оптики (ИТМО)", ["итмо", "санкт-петербург"]),
        new("Казанский (Приволжский) федеральный университет", ["кфу", "казанский", "казань"]),
        new("Уральский федеральный университет", ["урфу", "уральский", "екатеринбург"]),
        new("Новосибирский государственный университет", ["нгу", "новосибирский", "новосибирск"]),
        new("Московский физико-технический институт", ["мфти", "физтех", "москва"]),
        new("Чувашский государственный педагогический университет им. И.Я. Яковлева", ["чгпу", "педагогический", "яковлева", "чебоксары"]),
        new("Чебоксарский кооперативный институт", ["чки", "кооперативный", "чебоксары"])
    ];

    public static IReadOnlyList<object> Search(string? query, int limit)
    {
        var normalizedQuery = Normalize(query);
        var normalizedLimit = Math.Clamp(limit, 1, 30);

        var matches = string.IsNullOrWhiteSpace(normalizedQuery)
            ? Items
            : Items
                .Where(item => item.Matches(normalizedQuery))
                .ToArray();

        return matches
            .Take(normalizedLimit)
            .Select(item => (object)new
            {
                value = item.Label,
                label = item.Label,
            })
            .ToList();
    }

    private static string Normalize(string? value) =>
        value?.Trim().ToLowerInvariant() ?? string.Empty;

    private sealed record InstitutionCatalogItem(string Label, string[] Keywords)
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
