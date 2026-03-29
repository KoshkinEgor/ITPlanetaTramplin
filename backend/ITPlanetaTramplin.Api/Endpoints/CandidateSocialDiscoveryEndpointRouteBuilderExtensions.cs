using Application.DBContext;
using DTO;
using ITPlanetaTramplin.Api.Auth;
using ITPlanetaTramplin.Api.Domain;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using System.Text.Json;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static partial class CandidateEndpointRouteBuilderExtensions
{
    private static async Task<IResult> GetCurrentCandidateOpportunitySharesAsync(
        [FromQuery] string? box,
        HttpContext context,
        ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        var normalizedBox = NormalizeShareBox(box);
        IQueryable<OpportunityShare> query = db.OpportunityShares
            .AsNoTracking()
            .Include(item => item.Opportunity)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id);

        if (normalizedBox == "incoming")
        {
            query = query.Where(item => item.RecipientUserId == currentUserId.Value);
        }
        else if (normalizedBox == "outgoing")
        {
            query = query.Where(item => item.SenderUserId == currentUserId.Value);
        }
        else
        {
            query = query.Where(item => item.SenderUserId == currentUserId.Value || item.RecipientUserId == currentUserId.Value);
        }

        var shares = await query.ToListAsync();
        var result = new List<OpportunityShareReadDTO>(shares.Count);
        foreach (var share in shares)
        {
            result.Add(await MapOpportunityShareAsync(db, currentUserId.Value, share));
        }

        return Results.Ok(result);
    }

    private static async Task<IResult> CreateCurrentCandidateOpportunityShareAsync(
        [FromBody] OpportunityShareCreateDTO request,
        HttpContext context,
        ApplicationDBContext db)
    {
        var currentUserId = AuthEndpointSupport.GetCurrentUserId(context);
        if (currentUserId is null)
        {
            return Results.Unauthorized();
        }

        if (currentUserId.Value == request.RecipientUserId)
        {
            return AuthEndpointSupport.MessageResult("Нельзя отправить возможность самому себе.", StatusCodes.Status400BadRequest);
        }

        var recipientExists = await db.ApplicantProfiles.AnyAsync(item => item.UserId == request.RecipientUserId);
        if (!recipientExists)
        {
            return Results.NotFound();
        }

        var opportunity = await db.Opportunities.FirstOrDefaultAsync(item =>
            item.Id == request.OpportunityId &&
            item.DeletedAt == null);
        if (opportunity is null ||
            OpportunityEndpointRouteBuilderExtensions.GetEffectiveModerationStatus(opportunity) != OpportunityModerationStatuses.Approved)
        {
            return Results.NotFound();
        }

        var relationship = await BuildRelationshipSummaryAsync(db, currentUserId.Value, request.RecipientUserId);
        if (relationship.ContactState != "saved" && relationship.FriendState != "friends")
        {
            return AuthEndpointSupport.MessageResult("Поделиться возможностью можно только с контактами и друзьями.", StatusCodes.Status400BadRequest);
        }

        var existingShare = await db.OpportunityShares
            .Include(item => item.Opportunity)
            .FirstOrDefaultAsync(item =>
                item.SenderUserId == currentUserId.Value &&
                item.RecipientUserId == request.RecipientUserId &&
                item.OpportunityId == request.OpportunityId);

        if (existingShare is not null)
        {
            return Results.Ok(await MapOpportunityShareAsync(db, currentUserId.Value, existingShare));
        }

        var share = new OpportunityShare
        {
            SenderUserId = currentUserId.Value,
            RecipientUserId = request.RecipientUserId,
            OpportunityId = request.OpportunityId,
            Note = OpportunityEndpointRouteBuilderExtensions.NormalizeOptionalText(request.Note),
            CreatedAt = DateTime.UtcNow,
        };

        db.OpportunityShares.Add(share);
        await db.SaveChangesAsync();

        share.Opportunity = opportunity;
        return Results.Ok(await MapOpportunityShareAsync(db, currentUserId.Value, share));
    }

    private static async Task<IResult> GetCurrentCandidateContactSuggestionsAsync(
        [FromQuery] string? source,
        [FromQuery] int? limit,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var suggestions = await BuildContactSuggestionsAsync(
            db,
            profile,
            NormalizeSuggestionSource(source),
            ClampSuggestionLimit(limit));

        return Results.Ok(suggestions);
    }

    private static async Task<IResult> GetCandidateOpportunitySocialContextAsync(
        int opportunityId,
        HttpContext context,
        ApplicationDBContext db)
    {
        var profile = await GetCurrentCandidateProfileAsync(context, db);
        if (profile is null)
        {
            return Results.Unauthorized();
        }

        var opportunity = await db.Opportunities
            .AsNoTracking()
            .Include(item => item.Tags)
            .Include(item => item.Employer)
            .FirstOrDefaultAsync(item =>
                item.Id == opportunityId &&
                item.DeletedAt == null);

        if (opportunity is null ||
            OpportunityEndpointRouteBuilderExtensions.GetEffectiveModerationStatus(opportunity) != OpportunityModerationStatuses.Approved)
        {
            return Results.NotFound();
        }

        var socialContext = await BuildOpportunitySocialContextAsync(db, profile, opportunity, networkLimit: 6);
        return Results.Ok(socialContext);
    }

    private static async Task<List<SocialUserSummaryDTO>> BuildContactSuggestionsAsync(
        ApplicationDBContext db,
        ApplicantProfile currentProfile,
        string source,
        int limit)
    {
        var activeOpportunityTags = await GetCurrentCandidateOpportunityTagsAsync(db, currentProfile.Id);
        var currentSkills = (currentProfile.Skills ?? [])
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .ToList();
        var currentCity = ExtractCandidateCity(currentProfile.Links);

        var users = await db.Users
            .AsNoTracking()
            .Include(item => item.ApplicantProfile)
            .Where(item => item.Id != currentProfile.UserId && item.ApplicantProfile != null)
            .ToListAsync();

        var ranked = new List<(int score, SocialUserSummaryDTO summary)>();
        foreach (var user in users)
        {
            var relationship = await BuildRelationshipSummaryAsync(db, currentProfile.UserId, user.Id);
            if (ShouldExcludeFromSuggestions(source, relationship))
            {
                continue;
            }

            var reasons = BuildCandidateReasons(
                currentSkills,
                currentCity,
                activeOpportunityTags,
                user.ApplicantProfile!,
                opportunity: null,
                includeNetworkReason: false,
                includeSameOpportunityReason: false);

            var score = CalculateSuggestionScore(reasons);
            if (score == 0)
            {
                continue;
            }

            var summary = await GetSocialUserSummaryAsync(db, currentProfile.UserId, user.Id);
            summary.Reasons = reasons;
            ranked.Add((score, summary));
        }

        return ranked
            .OrderByDescending(item => item.score)
            .ThenBy(item => item.summary.Name, StringComparer.OrdinalIgnoreCase)
            .Take(limit)
            .Select(item => item.summary)
            .ToList();
    }

    private static async Task<OpportunitySocialContextDTO> BuildOpportunitySocialContextAsync(
        ApplicationDBContext db,
        ApplicantProfile currentProfile,
        Opportunity opportunity,
        int networkLimit)
    {
        var companyContacts = BuildCompanyContacts(opportunity.ContactsJson);
        var currentSkills = (currentProfile.Skills ?? [])
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .ToList();
        var currentCity = ExtractCandidateCity(currentProfile.Links);
        var opportunityTags = opportunity.Tags.Select(tag => tag.Name).ToList();

        var networkIds = await GetCurrentCandidateNetworkUserIdsAsync(db, currentProfile.UserId);
        var currentUserApplied = await db.Applications.AnyAsync(item => item.OpportunityId == opportunity.Id && item.ApplicantId == currentProfile.Id);

        var networkUsers = await db.Users
            .AsNoTracking()
            .Include(item => item.ApplicantProfile)
            .Where(item => networkIds.Contains(item.Id) && item.ApplicantProfile != null)
            .ToListAsync();

        var networkRanked = new List<(int priority, int score, SocialUserSummaryDTO summary)>();
        foreach (var user in networkUsers)
        {
            var relationship = await BuildRelationshipSummaryAsync(db, currentProfile.UserId, user.Id);
            var reasons = BuildCandidateReasons(
                currentSkills,
                currentCity,
                opportunityTags,
                user.ApplicantProfile!,
                opportunity,
                includeNetworkReason: true,
                includeSameOpportunityReason: false);

            var summary = await GetSocialUserSummaryAsync(db, currentProfile.UserId, user.Id);
            summary.Reasons = reasons;
            networkRanked.Add((
                priority: relationship.FriendState == "friends" ? 2 : 1,
                score: CalculateSuggestionScore(reasons),
                summary));
        }

        var suggestionUsers = await db.Users
            .AsNoTracking()
            .Include(item => item.ApplicantProfile)
            .Where(item => item.Id != currentProfile.UserId && !networkIds.Contains(item.Id) && item.ApplicantProfile != null)
            .ToListAsync();

        foreach (var user in suggestionUsers)
        {
            var relationship = await BuildRelationshipSummaryAsync(db, currentProfile.UserId, user.Id);
            if (relationship.ContactState == "saved" || relationship.FriendState != "none")
            {
                continue;
            }

            var reasons = BuildCandidateReasons(
                currentSkills,
                currentCity,
                opportunityTags,
                user.ApplicantProfile!,
                opportunity,
                includeNetworkReason: false,
                includeSameOpportunityReason: false);
            var score = CalculateSuggestionScore(reasons);
            if (score == 0)
            {
                continue;
            }

            var summary = await GetSocialUserSummaryAsync(db, currentProfile.UserId, user.Id);
            summary.Reasons = reasons;
            networkRanked.Add((0, score, summary));
        }

        var peers = await db.Applications
            .AsNoTracking()
            .Include(item => item.Applicant)
            .ThenInclude(item => item.User)
            .Where(item =>
                item.OpportunityId == opportunity.Id &&
                item.ApplicantId != currentProfile.Id &&
                item.AllowPeerVisibility)
            .OrderByDescending(item => item.AppliedAt)
            .ToListAsync();

        var peerItems = new List<SocialUserSummaryDTO>(peers.Count);
        foreach (var application in peers)
        {
            var userId = application.Applicant.UserId;
            var summary = await GetSocialUserSummaryAsync(db, currentProfile.UserId, userId);
            summary.Reasons = BuildCandidateReasons(
                currentSkills,
                currentCity,
                opportunityTags,
                application.Applicant,
                opportunity,
                includeNetworkReason: false,
                includeSameOpportunityReason: currentUserApplied);
            peerItems.Add(summary);
        }

        var incomingShareCount = await db.OpportunityShares.CountAsync(item =>
            item.OpportunityId == opportunity.Id &&
            item.RecipientUserId == currentProfile.UserId);

        var networkCandidates = networkRanked
            .OrderByDescending(item => item.priority)
            .ThenByDescending(item => item.score)
            .ThenBy(item => item.summary.Name, StringComparer.OrdinalIgnoreCase)
            .Take(networkLimit)
            .Select(item => item.summary)
            .ToList();

        return new OpportunitySocialContextDTO
        {
            CompanyContacts = companyContacts,
            NetworkCandidates = networkCandidates,
            Peers = peerItems,
            Counts = new OpportunitySocialContextCountsDTO
            {
                NetworkCandidateCount = networkCandidates.Count,
                PeerCount = peerItems.Count,
                IncomingShareCount = incomingShareCount,
            },
        };
    }

    private static async Task<SocialContextPreviewDTO> BuildApplicationSocialContextPreviewAsync(
        ApplicationDBContext db,
        ApplicantProfile currentProfile,
        Opportunity opportunity)
    {
        var socialContext = await BuildOpportunitySocialContextAsync(db, currentProfile, opportunity, networkLimit: 2);
        return new SocialContextPreviewDTO
        {
            CompanyContactsPreview = socialContext.CompanyContacts.Take(1).ToList(),
            NetworkCandidatesPreview = socialContext.NetworkCandidates.Take(2).ToList(),
            PeerCount = socialContext.Counts.PeerCount,
            IncomingShareCount = socialContext.Counts.IncomingShareCount,
        };
    }

    private static async Task<HashSet<int>> GetCurrentCandidateNetworkUserIdsAsync(ApplicationDBContext db, int currentUserId)
    {
        var savedContacts = await db.Contacts
            .AsNoTracking()
            .Where(item => item.UserId == currentUserId)
            .Select(item => item.ContactProfileId)
            .ToListAsync();

        var friendIds = await db.FriendRequests
            .AsNoTracking()
            .Where(item =>
                (item.SenderUserId == currentUserId || item.RecipientUserId == currentUserId) &&
                item.Status == FriendRequestStatuses.Accepted)
            .Select(item => item.SenderUserId == currentUserId ? item.RecipientUserId : item.SenderUserId)
            .ToListAsync();

        return savedContacts.Concat(friendIds).ToHashSet();
    }

    private static async Task<List<string>> GetCurrentCandidateOpportunityTagsAsync(ApplicationDBContext db, int applicantId)
    {
        return await db.Applications
            .AsNoTracking()
            .Where(item =>
                item.ApplicantId == applicantId &&
                item.Status != OpportunityApplicationStatuses.Withdrawn &&
                item.Status != OpportunityApplicationStatuses.Rejected)
            .SelectMany(item => item.Opportunity.Tags.Select(tag => tag.Name))
            .Distinct()
            .ToListAsync();
    }

    private static async Task<OpportunityShareReadDTO> MapOpportunityShareAsync(
        ApplicationDBContext db,
        int currentUserId,
        OpportunityShare share)
    {
        var counterpartyUserId = share.SenderUserId == currentUserId ? share.RecipientUserId : share.SenderUserId;

        return new OpportunityShareReadDTO
        {
            Id = share.Id,
            SenderUserId = share.SenderUserId,
            RecipientUserId = share.RecipientUserId,
            OpportunityId = share.OpportunityId,
            OpportunityTitle = share.Opportunity?.Title ?? string.Empty,
            Note = share.Note,
            CreatedAt = share.CreatedAt,
            Counterparty = await GetSocialUserSummaryAsync(db, currentUserId, counterpartyUserId),
        };
    }

    private static List<CompanyContactDTO> BuildCompanyContacts(string? contactsJson)
    {
        if (string.IsNullOrWhiteSpace(contactsJson))
        {
            return [];
        }

        try
        {
            using var document = JsonDocument.Parse(contactsJson);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return [];
            }

            var result = new List<CompanyContactDTO>();
            foreach (var item in document.RootElement.EnumerateArray())
            {
                var type = item.TryGetProperty("type", out var typeValue)
                    ? typeValue.GetString()?.Trim().ToLowerInvariant()
                    : null;
                var value = item.TryGetProperty("value", out var valueValue)
                    ? valueValue.GetString()?.Trim()
                    : null;

                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                result.Add(new CompanyContactDTO
                {
                    Type = type switch
                    {
                        "email" => "email",
                        "phone" => "phone",
                        _ => "link",
                    },
                    Label = type switch
                    {
                        "email" => "Email компании",
                        "phone" => "Телефон компании",
                        _ => "Ссылка компании",
                    },
                    Value = value,
                    Href = type switch
                    {
                        "email" => $"mailto:{value}",
                        "phone" => $"tel:{value.Replace(" ", string.Empty, StringComparison.Ordinal)}",
                        _ => value,
                    },
                });
            }

            return result;
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static List<string> BuildCandidateReasons(
        IReadOnlyCollection<string> currentSkills,
        string? currentCity,
        IReadOnlyCollection<string> opportunityTags,
        ApplicantProfile targetProfile,
        Opportunity? opportunity,
        bool includeNetworkReason,
        bool includeSameOpportunityReason)
    {
        var reasons = new List<string>();
        var targetSkills = (targetProfile.Skills ?? [])
            .Select(item => item?.Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item!)
            .ToList();
        var sharedSkills = targetSkills
            .Where(skill => currentSkills.Any(item => string.Equals(item, skill, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();
        if (sharedSkills.Count > 0)
        {
            reasons.Add($"Общие навыки: {string.Join(", ", sharedSkills)}");
        }

        var targetCity = ExtractCandidateCity(targetProfile.Links);
        if (!string.IsNullOrWhiteSpace(currentCity) &&
            string.Equals(currentCity, targetCity, StringComparison.OrdinalIgnoreCase))
        {
            reasons.Add("Тот же город");
        }

        var matchingOpportunityTags = targetSkills
            .Where(skill => opportunityTags.Any(tag => string.Equals(tag, skill, StringComparison.OrdinalIgnoreCase)))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(3)
            .ToList();
        if (matchingOpportunityTags.Count > 0)
        {
            reasons.Add(opportunity is null
                ? "Релевантно к вашим откликам"
                : $"Подходит к {opportunity.Title}");
        }

        if (includeNetworkReason)
        {
            reasons.Add("Уже в вашей сети");
        }

        if (includeSameOpportunityReason)
        {
            reasons.Add("Уже откликнулся на ту же возможность");
        }

        return reasons
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static int CalculateSuggestionScore(IReadOnlyCollection<string> reasons)
    {
        var score = 0;
        foreach (var reason in reasons)
        {
            if (reason.StartsWith("Общие навыки", StringComparison.OrdinalIgnoreCase))
            {
                score += 30;
                continue;
            }

            if (reason.StartsWith("Подходит к", StringComparison.OrdinalIgnoreCase) ||
                reason.StartsWith("Релевантно к", StringComparison.OrdinalIgnoreCase))
            {
                score += 24;
                continue;
            }

            if (string.Equals(reason, "Уже в вашей сети", StringComparison.OrdinalIgnoreCase))
            {
                score += 20;
                continue;
            }

            if (string.Equals(reason, "Уже откликнулся на ту же возможность", StringComparison.OrdinalIgnoreCase))
            {
                score += 18;
                continue;
            }

            if (string.Equals(reason, "Тот же город", StringComparison.OrdinalIgnoreCase))
            {
                score += 10;
            }
        }

        return score;
    }

    private static bool ShouldExcludeFromSuggestions(string source, RelationshipSummaryDTO relationship) =>
        source switch
        {
            "overview" or "dashboard" or "contacts" =>
                relationship.ContactState == "saved" ||
                relationship.FriendState != "none",
            _ => false,
        };

    private static string NormalizeShareBox(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            "incoming" => "incoming",
            "outgoing" => "outgoing",
            _ => "all",
        };

    private static string NormalizeSuggestionSource(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            "overview" => "overview",
            "dashboard" => "dashboard",
            "contacts" => "contacts",
            _ => "contacts",
        };

    private static int ClampSuggestionLimit(int? value)
    {
        var normalized = value ?? 6;
        return Math.Clamp(normalized, 1, 12);
    }

    private static bool GetPeerVisibilityDefault(ApplicantProfile profile)
    {
        var links = ParseJsonObject(profile.Links);
        var preferences = GetObjectNode(links, "preferences");
        var social = preferences?["social"] as System.Text.Json.Nodes.JsonObject;
        return social?["peerVisibilityDefault"]?.GetValue<bool?>() == true;
    }
}
