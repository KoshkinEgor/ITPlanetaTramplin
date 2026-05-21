using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModeratorSystemModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "merged_into_tag_id",
                table: "tags",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at",
                table: "tags",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "updated_by_user_id",
                table: "tags",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "moderation_audit_logs",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    actor_user_id = table.Column<int>(type: "integer", nullable: true),
                    action = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    entity_id = table.Column<int>(type: "integer", nullable: true),
                    summary = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    metadata = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("moderation_audit_logs_pkey", x => x.id);
                    table.ForeignKey(
                        name: "moderation_audit_logs_actor_user_id_fkey",
                        column: x => x.actor_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "moderator_settings",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    notification_settings = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    queue_settings = table.Column<string>(type: "jsonb", nullable: false, defaultValueSql: "'{}'::jsonb"),
                    start_page = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("moderator_settings_pkey", x => x.id);
                    table.ForeignKey(
                        name: "moderator_settings_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "system_reference_items",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    category = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    key = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    label = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by_user_id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("system_reference_items_pkey", x => x.id);
                    table.ForeignKey(
                        name: "system_reference_items_updated_by_user_id_fkey",
                        column: x => x.updated_by_user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.InsertData(
                table: "system_reference_items",
                columns: new[] { "id", "category", "key", "label", "is_active", "is_system", "sort_order" },
                values: new object[,]
                {
                    { 1, "opportunity_types", "vacancy", "Вакансия", true, true, 10 },
                    { 2, "opportunity_types", "internship", "Стажировка", true, true, 20 },
                    { 3, "opportunity_types", "event", "Мероприятие", true, true, 30 },
                    { 4, "opportunity_types", "mentoring", "Менторская программа", true, true, 40 },
                    { 5, "employment_types", "office", "Офис", true, true, 10 },
                    { 6, "employment_types", "hybrid", "Гибрид", true, true, 20 },
                    { 7, "employment_types", "remote", "Удаленно", true, true, 30 },
                    { 8, "employment_types", "online", "Онлайн", true, true, 40 },
                    { 9, "opportunity_levels", "no_experience", "Без опыта", true, false, 10 },
                    { 10, "opportunity_levels", "junior", "Junior", true, false, 20 },
                    { 11, "opportunity_levels", "middle", "Middle", true, false, 30 },
                    { 12, "opportunity_levels", "senior", "Senior", true, false, 40 },
                    { 13, "complaint_reasons", "spam", "Спам или мошенничество", true, false, 10 },
                    { 14, "complaint_reasons", "incorrect_data", "Некорректная информация", true, false, 20 },
                    { 15, "complaint_reasons", "contacts", "Проблема с контактами", true, false, 30 },
                    { 16, "complaint_reasons", "other", "Другое", true, false, 40 },
                    { 17, "moderation_statuses", "pending", "На проверке", true, true, 10 },
                    { 18, "moderation_statuses", "approved", "Одобрено", true, true, 20 },
                    { 19, "moderation_statuses", "revision", "На доработке", true, true, 30 },
                    { 20, "moderation_statuses", "rejected", "Отклонено", true, true, 40 },
                    { 21, "moderation_statuses", "archived", "В архиве", true, true, 50 }
                });

            migrationBuilder.Sql("SELECT setval(pg_get_serial_sequence('system_reference_items', 'id'), 21, true);");

            migrationBuilder.CreateIndex(
                name: "idx_tags_merged_into_tag_id",
                table: "tags",
                column: "merged_into_tag_id");

            migrationBuilder.CreateIndex(
                name: "idx_tags_updated_by_user_id",
                table: "tags",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_moderation_audit_logs_actor_user_id",
                table: "moderation_audit_logs",
                column: "actor_user_id");

            migrationBuilder.CreateIndex(
                name: "idx_moderation_audit_logs_created_at",
                table: "moderation_audit_logs",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "idx_moderation_audit_logs_entity",
                table: "moderation_audit_logs",
                columns: new[] { "entity_type", "entity_id" });

            migrationBuilder.CreateIndex(
                name: "moderator_settings_user_id_key",
                table: "moderator_settings",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_system_reference_items_category_active_sort",
                table: "system_reference_items",
                columns: new[] { "category", "is_active", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_system_reference_items_updated_by_user_id",
                table: "system_reference_items",
                column: "updated_by_user_id");

            migrationBuilder.CreateIndex(
                name: "system_reference_items_category_key_key",
                table: "system_reference_items",
                columns: new[] { "category", "key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "tags_merged_into_tag_id_fkey",
                table: "tags",
                column: "merged_into_tag_id",
                principalTable: "tags",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "tags_updated_by_user_id_fkey",
                table: "tags",
                column: "updated_by_user_id",
                principalTable: "users",
                principalColumn: "id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "tags_merged_into_tag_id_fkey",
                table: "tags");

            migrationBuilder.DropForeignKey(
                name: "tags_updated_by_user_id_fkey",
                table: "tags");

            migrationBuilder.DropTable(
                name: "moderation_audit_logs");

            migrationBuilder.DropTable(
                name: "moderator_settings");

            migrationBuilder.DropTable(
                name: "system_reference_items");

            migrationBuilder.DropIndex(
                name: "idx_tags_merged_into_tag_id",
                table: "tags");

            migrationBuilder.DropIndex(
                name: "idx_tags_updated_by_user_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "merged_into_tag_id",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "updated_at",
                table: "tags");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "tags");
        }
    }
}
