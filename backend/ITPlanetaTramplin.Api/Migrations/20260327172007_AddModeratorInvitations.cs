using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModeratorInvitations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "moderator_invitations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    surname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    thirdname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    invited_by_user_id = table.Column<int>(type: "integer", nullable: false),
                    accepted_user_id = table.Column<int>(type: "integer", nullable: true),
                    token_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    revoked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("moderator_invitations_pkey", x => x.id);
                    table.ForeignKey(
                        name: "moderator_invitations_accepted_user_id_fkey",
                        column: x => x.accepted_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "moderator_invitations_invited_by_user_id_fkey",
                        column: x => x.invited_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_moderator_invitations_accepted_user_id",
                table: "moderator_invitations",
                column: "accepted_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_moderator_invitations_email",
                table: "moderator_invitations",
                column: "email");

            migrationBuilder.CreateIndex(
                name: "idx_moderator_invitations_invited_by_user_id",
                table: "moderator_invitations",
                column: "invited_by_user_id");

            migrationBuilder.CreateIndex(
                name: "moderator_invitations_token_hash_key",
                table: "moderator_invitations",
                column: "token_hash",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "moderator_invitations");
        }
    }
}
