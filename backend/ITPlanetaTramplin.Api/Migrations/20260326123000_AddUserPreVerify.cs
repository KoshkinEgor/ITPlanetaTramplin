using Application.DBContext;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    [DbContext(typeof(ApplicationDBContext))]
    [Migration("20260326123000_AddUserPreVerify")]
    public partial class AddUserPreVerify : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "pre_verify",
                table: "users",
                type: "boolean",
                nullable: true,
                defaultValue: true);

            migrationBuilder.Sql(
                """
                UPDATE users
                SET pre_verify = TRUE
                WHERE pre_verify IS NULL;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "pre_verify",
                table: "users");
        }
    }
}
