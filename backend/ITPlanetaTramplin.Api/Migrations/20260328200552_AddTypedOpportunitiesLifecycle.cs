using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTypedOpportunitiesLifecycle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "moderation_status",
                table: "opportunities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "draft",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "pending");

            migrationBuilder.AddColumn<string>(
                name: "duration",
                table: "opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "event_start_at",
                table: "opportunities",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_paid",
                table: "opportunities",
                type: "boolean",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "meeting_frequency",
                table: "opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "moderation_reason",
                table: "opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "registration_deadline",
                table: "opportunities",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "salary_from",
                table: "opportunities",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "salary_to",
                table: "opportunities",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "seats_count",
                table: "opportunities",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "stipend_from",
                table: "opportunities",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "stipend_to",
                table: "opportunities",
                type: "numeric(12,2)",
                precision: 12,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "verification_reason",
                table: "employer_profiles",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "duration",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "event_start_at",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "is_paid",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "meeting_frequency",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "moderation_reason",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "registration_deadline",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "salary_from",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "salary_to",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "seats_count",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "stipend_from",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "stipend_to",
                table: "opportunities");

            migrationBuilder.DropColumn(
                name: "verification_reason",
                table: "employer_profiles");

            migrationBuilder.AlterColumn<string>(
                name: "moderation_status",
                table: "opportunities",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "pending",
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldDefaultValue: "draft");
        }
    }
}
