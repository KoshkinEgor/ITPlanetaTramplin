using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOpportunityExperienceScheduleAndCompanySettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "experience_level",
                table: "opportunities",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "schedule",
                table: "opportunities",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "company_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employer_id = table.Column<int>(type: "integer", nullable: false),
                    notification_email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    notify_new_applications = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_moderation_updates = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notify_complaints_and_system = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    default_start_section = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "profile"),
                    default_responses_sort = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "newest"),
                    show_archived_opportunities = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("company_settings_pkey", x => x.id);
                    table.ForeignKey(
                        name: "company_settings_employer_id_fkey",
                        column: x => x.employer_id,
                        principalTable: "employer_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "company_settings_employer_id_key",
                table: "company_settings",
                column: "employer_id",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO system_reference_items (category, "key", label, is_active, is_system, sort_order)
                VALUES
                    ('experience_levels', 'no_experience', 'Без опыта', true, false, 10),
                    ('experience_levels', 'junior', 'Junior', true, false, 20),
                    ('experience_levels', 'middle', 'Middle', true, false, 30),
                    ('experience_levels', 'senior', 'Senior', true, false, 40),
                    ('experience_levels', 'lead', 'Lead', true, false, 50),
                    ('work_schedules', 'full_time', 'Полный день', true, false, 10),
                    ('work_schedules', 'part_time', 'Частичная занятость', true, false, 20),
                    ('work_schedules', 'flexible', 'Гибкий график', true, false, 30),
                    ('work_schedules', 'weekends', 'По выходным', true, false, 40),
                    ('work_schedules', 'shift', 'Сменный график', true, false, 50)
                ON CONFLICT (category, "key") DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "company_settings");

            migrationBuilder.Sql("""
                DELETE FROM system_reference_items
                WHERE category IN ('experience_levels', 'work_schedules');
                """);

            migrationBuilder.DropColumn(
                name: "experience_level",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "schedule",
                table: "opportunities");
        }
    }
}
