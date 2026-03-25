using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class contactfix : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_contacts_users_ContactNavigationId",
                table: "contacts");

            migrationBuilder.DropIndex(
                name: "IX_contacts_ContactNavigationId",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "ContactNavigationId",
                table: "contacts");

            migrationBuilder.AddForeignKey(
                name: "FK_contacts_users_contact_id",
                table: "contacts",
                column: "contact_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_contacts_users_contact_id",
                table: "contacts");

            migrationBuilder.AddColumn<int>(
                name: "ContactNavigationId",
                table: "contacts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_contacts_ContactNavigationId",
                table: "contacts",
                column: "ContactNavigationId");

            migrationBuilder.AddForeignKey(
                name: "FK_contacts_users_ContactNavigationId",
                table: "contacts",
                column: "ContactNavigationId",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
