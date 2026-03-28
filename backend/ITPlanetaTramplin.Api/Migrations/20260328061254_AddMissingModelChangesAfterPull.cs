using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingModelChangesAfterPull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "candidate_project_invites",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sender_user_id = table.Column<int>(type: "integer", nullable: false),
                    recipient_user_id = table.Column<int>(type: "integer", nullable: false),
                    project_id = table.Column<int>(type: "integer", nullable: false),
                    role = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    message = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("candidate_project_invites_pkey", x => x.id);
                    table.CheckConstraint("CK_CandidateProjectInvites_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
                    table.ForeignKey(
                        name: "candidate_project_invites_project_id_fkey",
                        column: x => x.project_id,
                        principalTable: "candidate_projects",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "candidate_project_invites_recipient_user_id_fkey",
                        column: x => x.recipient_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "candidate_project_invites_sender_user_id_fkey",
                        column: x => x.sender_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "friend_requests",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    sender_user_id = table.Column<int>(type: "integer", nullable: false),
                    recipient_user_id = table.Column<int>(type: "integer", nullable: false),
                    status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false, defaultValue: "pending"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    responded_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("friend_requests_pkey", x => x.id);
                    table.CheckConstraint("CK_FriendRequests_SenderNotEqualRecipient", "sender_user_id <> recipient_user_id");
                    table.ForeignKey(
                        name: "friend_requests_recipient_user_id_fkey",
                        column: x => x.recipient_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "friend_requests_sender_user_id_fkey",
                        column: x => x.sender_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "idx_candidate_project_invites_project_id",
                table: "candidate_project_invites",
                column: "project_id");

            migrationBuilder.CreateIndex(
                name: "idx_candidate_project_invites_recipient_user_id",
                table: "candidate_project_invites",
                column: "recipient_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_candidate_project_invites_sender_user_id",
                table: "candidate_project_invites",
                column: "sender_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_friend_requests_recipient_user_id",
                table: "friend_requests",
                column: "recipient_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_friend_requests_sender_user_id",
                table: "friend_requests",
                column: "sender_user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "candidate_project_invites");

            migrationBuilder.DropTable(
                name: "friend_requests");
        }
    }
}
