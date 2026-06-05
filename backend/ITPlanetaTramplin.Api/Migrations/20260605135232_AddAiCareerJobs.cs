using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAiCareerJobs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE ai_career_cache SET scope = 'legacy' WHERE scope = 'career';");

            migrationBuilder.CreateTable(
                name: "ai_career_jobs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    applicant_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    reason = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    signature = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("ai_career_jobs_pkey", x => x.id);
                    table.ForeignKey(
                        name: "ai_career_jobs_applicant_id_fkey",
                        column: x => x.applicant_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ai_career_job_steps",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    job_id = table.Column<Guid>(type: "uuid", nullable: false),
                    step = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    status = table.Column<string>(type: "character varying(24)", maxLength: 24, nullable: false),
                    attempt_count = table.Column<int>(type: "integer", nullable: false),
                    available_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    lease_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    error_code = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    error_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("ai_career_job_steps_pkey", x => x.id);
                    table.ForeignKey(
                        name: "ai_career_job_steps_job_id_fkey",
                        column: x => x.job_id,
                        principalTable: "ai_career_jobs",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ai_career_job_steps_job_id_step_key",
                table: "ai_career_job_steps",
                columns: new[] { "job_id", "step" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_ai_career_job_steps_claim",
                table: "ai_career_job_steps",
                columns: new[] { "status", "available_at" });

            migrationBuilder.CreateIndex(
                name: "idx_ai_career_jobs_applicant_id",
                table: "ai_career_jobs",
                column: "applicant_id");

            migrationBuilder.CreateIndex(
                name: "idx_ai_career_jobs_created_at",
                table: "ai_career_jobs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "ux_ai_career_jobs_active_applicant",
                table: "ai_career_jobs",
                column: "applicant_id",
                unique: true,
                filter: "\"status\" IN ('queued', 'running')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_career_job_steps");

            migrationBuilder.DropTable(
                name: "ai_career_jobs");

            migrationBuilder.Sql(
                "DELETE FROM ai_career_cache WHERE scope IN ('profile', 'career', 'opportunities');");
            migrationBuilder.Sql(
                "UPDATE ai_career_cache SET scope = 'career' WHERE scope = 'legacy';");
        }
    }
}
