using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRealDataDomainModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "moderation_status",
                table: "opportunities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "pending");

            migrationBuilder.AlterColumn<string>(
                name: "verification_status",
                table: "employer_profiles",
                type: "text",
                nullable: false,
                defaultValue: "pending",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "На рассмотрении");

            migrationBuilder.AddColumn<string>(
                name: "employer_note",
                table: "applications",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "applications",
                type: "text",
                nullable: false,
                defaultValue: "submitted");

            migrationBuilder.Sql(
                """
                UPDATE employer_profiles
                SET verification_status = CASE
                    WHEN lower(verification_status) = 'на рассмотрении' THEN 'pending'
                    WHEN lower(verification_status) IN ('верифицирован', 'подтвержден') THEN 'approved'
                    WHEN lower(verification_status) = 'доработка' THEN 'revision'
                    WHEN lower(verification_status) = 'отклонен' THEN 'rejected'
                    WHEN lower(verification_status) IN ('pending', 'approved', 'revision', 'rejected') THEN lower(verification_status)
                    ELSE 'pending'
                END;
                """);

            migrationBuilder.Sql(
                """
                UPDATE opportunities
                SET moderation_status = CASE
                    WHEN deleted_at IS NOT NULL THEN 'rejected'
                    ELSE 'approved'
                END
                WHERE moderation_status = 'pending';
                """);

            migrationBuilder.Sql(
                """
                UPDATE applications
                SET status = 'submitted'
                WHERE status IS NULL OR status = '';
                """);

            migrationBuilder.CreateTable(
                name: "candidate_projects",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    applicant_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    project_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    short_description = table.Column<string>(type: "text", nullable: false),
                    organization = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    role = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    team_size = table.Column<int>(type: "integer", nullable: true),
                    start_date = table.Column<DateOnly>(type: "date", nullable: false),
                    end_date = table.Column<DateOnly>(type: "date", nullable: true),
                    is_ongoing = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    problem = table.Column<string>(type: "text", nullable: false),
                    contribution = table.Column<string>(type: "text", nullable: false),
                    result = table.Column<string>(type: "text", nullable: false),
                    metrics = table.Column<string>(type: "text", nullable: true),
                    lessons_learned = table.Column<string>(type: "text", nullable: true),
                    tags = table.Column<List<string>>(type: "character varying(100)[]", nullable: true),
                    cover_image_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    demo_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    repository_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    design_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    case_study_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    show_in_portfolio = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("candidate_projects_pkey", x => x.id);
                    table.ForeignKey(
                        name: "candidate_projects_applicant_id_fkey",
                        column: x => x.applicant_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_candidate_projects_applicant_id",
                table: "candidate_projects",
                column: "applicant_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "candidate_projects");

            migrationBuilder.DropColumn(
                name: "moderation_status",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "employer_note",
                table: "applications");

            migrationBuilder.DropColumn(
                name: "status",
                table: "applications");

            migrationBuilder.AlterColumn<string>(
                name: "verification_status",
                table: "employer_profiles",
                type: "text",
                nullable: false,
                defaultValue: "На рассмотрении",
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "pending");
        }
    }
}
