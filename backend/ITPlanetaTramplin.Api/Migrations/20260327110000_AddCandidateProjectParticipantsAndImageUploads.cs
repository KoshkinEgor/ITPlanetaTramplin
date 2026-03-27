using Application.DBContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    [DbContext(typeof(ApplicationDBContext))]
    [Migration("20260327110000_AddCandidateProjectParticipantsAndImageUploads")]
    public partial class AddCandidateProjectParticipantsAndImageUploads : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "cover_image_url",
                table: "candidate_projects",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "participants",
                table: "candidate_projects",
                type: "jsonb",
                nullable: true,
                defaultValueSql: "'[]'::jsonb");

            migrationBuilder.Sql(
                """
                UPDATE candidate_projects
                SET participants = '[]'::jsonb
                WHERE participants IS NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                UPDATE candidate_projects
                SET cover_image_url = LEFT(cover_image_url, 1000)
                WHERE cover_image_url IS NOT NULL;
                """);

            migrationBuilder.DropColumn(
                name: "participants",
                table: "candidate_projects");

            migrationBuilder.AlterColumn<string>(
                name: "cover_image_url",
                table: "candidate_projects",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);
        }
    }
}
