using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyPublicProfileSections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "case_studies",
                table: "employer_profiles",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gallery",
                table: "employer_profiles",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "hero_media",
                table: "employer_profiles",
                type: "jsonb",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "case_studies",
                table: "employer_profiles");

            migrationBuilder.DropColumn(
                name: "gallery",
                table: "employer_profiles");

            migrationBuilder.DropColumn(
                name: "hero_media",
                table: "employer_profiles");
        }
    }
}
