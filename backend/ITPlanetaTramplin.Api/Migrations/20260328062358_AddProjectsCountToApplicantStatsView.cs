using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectsCountToApplicantStatsView : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP VIEW IF EXISTS v_applicant_stats;

                CREATE VIEW v_applicant_stats AS
                SELECT
                    ap.id AS profile_id,
                    COALESCE(responses.responses_count, 0) AS responses_count,
                    COALESCE(educations.educations_count, 0) AS educations_count,
                    COALESCE(achievements.achievements_count, 0) AS achievements_count,
                    COALESCE(projects.projects_count, 0) AS projects_count,
                    COALESCE(contacts.contact_count, 0) AS contact_count
                FROM applicant_profiles ap
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS responses_count
                    FROM applications
                    GROUP BY applicant_id
                ) responses ON responses.applicant_id = ap.id
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS educations_count
                    FROM applicant_educations
                    GROUP BY applicant_id
                ) educations ON educations.applicant_id = ap.id
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS achievements_count
                    FROM applicant_achievements
                    GROUP BY applicant_id
                ) achievements ON achievements.applicant_id = ap.id
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS projects_count
                    FROM candidate_projects
                    GROUP BY applicant_id
                ) projects ON projects.applicant_id = ap.id
                LEFT JOIN (
                    SELECT user_id, COUNT(*) AS contact_count
                    FROM contacts
                    GROUP BY user_id
                ) contacts ON contacts.user_id = ap.user_id;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP VIEW IF EXISTS v_applicant_stats;

                CREATE VIEW v_applicant_stats AS
                SELECT
                    ap.id AS profile_id,
                    COALESCE(responses.responses_count, 0) AS responses_count,
                    COALESCE(educations.educations_count, 0) AS educations_count,
                    COALESCE(achievements.achievements_count, 0) AS achievements_count,
                    COALESCE(contacts.contact_count, 0) AS contact_count
                FROM applicant_profiles ap
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS responses_count
                    FROM applications
                    GROUP BY applicant_id
                ) responses ON responses.applicant_id = ap.id
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS educations_count
                    FROM applicant_educations
                    GROUP BY applicant_id
                ) educations ON educations.applicant_id = ap.id
                LEFT JOIN (
                    SELECT applicant_id, COUNT(*) AS achievements_count
                    FROM applicant_achievements
                    GROUP BY applicant_id
                ) achievements ON achievements.applicant_id = ap.id
                LEFT JOIN (
                    SELECT user_id, COUNT(*) AS contact_count
                    FROM contacts
                    GROUP BY user_id
                ) contacts ON contacts.user_id = ap.user_id;
                """);
        }
    }
}
