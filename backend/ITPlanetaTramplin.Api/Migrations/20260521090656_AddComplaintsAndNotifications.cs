using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddComplaintsAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "complaints",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    reporter_user_id = table.Column<int>(type: "integer", nullable: false),
                    opportunity_id = table.Column<int>(type: "integer", nullable: false),
                    reason = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "pending"),
                    moderator_note = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    resolved_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    resolved_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("complaints_pkey", x => x.id);
                    table.ForeignKey(
                        name: "complaints_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "complaints_reporter_user_id_fkey",
                        column: x => x.reporter_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "complaints_resolved_by_user_id_fkey",
                        column: x => x.resolved_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "user_notifications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    message = table.Column<string>(type: "text", nullable: true),
                    link = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    is_read = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    actor_user_id = table.Column<int>(type: "integer", nullable: true),
                    opportunity_id = table.Column<int>(type: "integer", nullable: true),
                    application_id = table.Column<int>(type: "integer", nullable: true),
                    complaint_id = table.Column<int>(type: "integer", nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb")
                },
                constraints: table =>
                {
                    table.PrimaryKey("user_notifications_pkey", x => x.id);
                    table.ForeignKey(
                        name: "user_notifications_actor_user_id_fkey",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "user_notifications_application_id_fkey",
                        column: x => x.application_id,
                        principalTable: "applications",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "user_notifications_complaint_id_fkey",
                        column: x => x.complaint_id,
                        principalTable: "complaints",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "user_notifications_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "user_notifications_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_complaints_created_at",
                table: "complaints",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_complaints_opportunity_id",
                table: "complaints",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "idx_complaints_reporter_user_id",
                table: "complaints",
                column: "reporter_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_complaints_status",
                table: "complaints",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_complaints_resolved_by_user_id",
                table: "complaints",
                column: "resolved_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_user_notifications_created_at",
                table: "user_notifications",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_user_notifications_user_id",
                table: "user_notifications",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_user_notifications_user_unread_created_at",
                table: "user_notifications",
                columns: new[] { "user_id", "is_read", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_actor_user_id",
                table: "user_notifications",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_application_id",
                table: "user_notifications",
                column: "application_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_complaint_id",
                table: "user_notifications",
                column: "complaint_id");

            migrationBuilder.CreateIndex(
                name: "IX_user_notifications_opportunity_id",
                table: "user_notifications",
                column: "opportunity_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "user_notifications");

            migrationBuilder.DropTable(
                name: "complaints");
        }
    }
}
