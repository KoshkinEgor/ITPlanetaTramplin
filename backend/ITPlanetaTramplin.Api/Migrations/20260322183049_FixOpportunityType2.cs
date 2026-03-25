using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixOpportunityType2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "employer_note",
                table: "applications");

            migrationBuilder.AddColumn<string>(
                name: "employment_type",
                table: "opportunities",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "employment_type",
                table: "opportunities");

            migrationBuilder.AddColumn<string>(
                name: "employer_note",
                table: "applications",
                type: "text",
                nullable: true);
        }
    }
}
