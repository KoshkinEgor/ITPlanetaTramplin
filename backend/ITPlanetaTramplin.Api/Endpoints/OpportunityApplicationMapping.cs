using System.Linq.Expressions;
using DTO;
using Models;

namespace ITPlanetaTramplin.Api.Endpoints;

internal static class OpportunityApplicationMapping
{
    public static readonly Expression<Func<OpportunityApplication, OpportunityApplicationSummaryDTO>> CandidateSummaryProjection = item => new OpportunityApplicationSummaryDTO
    {
        Id = item.Id,
        OpportunityId = item.OpportunityId,
        Status = item.Status,
        EmployerNote = item.EmployerNote,
        AppliedAt = item.AppliedAt,
        OpportunityTitle = item.Opportunity.Title,
        OpportunityType = item.Opportunity.OpportunityType,
        CompanyName = item.Opportunity.Employer.CompanyName,
        LocationCity = item.Opportunity.LocationCity,
        EmploymentType = item.Opportunity.EmploymentType,
        OpportunityDeleted = item.Opportunity.DeletedAt != null,
        ModerationStatus = item.Opportunity.ModerationStatus,
    };

    public static OpportunityApplicationSummaryDTO ToCandidateSummary(OpportunityApplication item) =>
        new()
        {
            Id = item.Id,
            OpportunityId = item.OpportunityId,
            Status = item.Status,
            EmployerNote = item.EmployerNote,
            AppliedAt = item.AppliedAt,
            OpportunityTitle = item.Opportunity.Title,
            OpportunityType = item.Opportunity.OpportunityType,
            CompanyName = item.Opportunity.Employer.CompanyName,
            LocationCity = item.Opportunity.LocationCity,
            EmploymentType = item.Opportunity.EmploymentType,
            OpportunityDeleted = item.Opportunity.DeletedAt != null,
            ModerationStatus = item.Opportunity.ModerationStatus,
        };
}
