using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOpportunitySharesAndPeerVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "allow_peer_visibility",
                table: "applications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "opportunity_shares",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sender_user_id = table.Column<int>(type: "integer", nullable: false),
                    recipient_user_id = table.Column<int>(type: "integer", nullable: false),
                    opportunity_id = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("opportunity_shares_pkey", x => x.id);
                    table.CheckConstraint("CK_OpportunityShares_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
                    table.ForeignKey(
                        name: "opportunity_shares_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "opportunity_shares_recipient_user_id_fkey",
                        column: x => x.recipient_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "opportunity_shares_sender_user_id_fkey",
                        column: x => x.sender_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_opportunity_shares_opportunity_id",
                table: "opportunity_shares",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity_shares_recipient_user_id",
                table: "opportunity_shares",
                column: "recipient_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity_shares_sender_user_id",
                table: "opportunity_shares",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "opportunity_shares_sender_user_id_recipient_user_id_opportunity_id_key",
                table: "opportunity_shares",
                columns: new[] { "sender_user_id", "recipient_user_id", "opportunity_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "opportunity_shares");

            migrationBuilder.DropColumn(
                name: "allow_peer_visibility",
                table: "applications");
        }
    }
}
