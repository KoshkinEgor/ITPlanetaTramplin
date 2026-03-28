using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCuratorAdminAndCandidateModerationStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "is_administrator",
                table: "curator_profiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "moderation_status",
                table: "applicant_profiles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "pending");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "is_administrator",
                table: "curator_profiles");

            migrationBuilder.DropColumn(
                name: "moderation_status",
                table: "applicant_profiles");
        }
    }
}
