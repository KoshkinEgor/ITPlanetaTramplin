using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using NpgsqlTypes;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixOpportunityType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    is_verified = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    deleted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("users_pkey", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "applicant_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Surname = table.Column<string>(type: "text", nullable: false),
                    Thirdname = table.Column<string>(type: "text", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    skills = table.Column<List<string>>(type: "character varying(100)[]", nullable: true),
                    links = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb"),
                    privacy_settings = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{\"hide_resume\": false, \"hide_responses\": false}'::jsonb")
                },
                constraints: table =>
                {
                    table.PrimaryKey("applicant_profiles_pkey", x => x.id);
                    table.ForeignKey(
                        name: "applicant_profiles_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    contact_id = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    ContactNavigationId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("contacts_pkey", x => new { x.user_id, x.contact_id });
                    table.ForeignKey(
                        name: "FK_contacts_users_ContactNavigationId",
                        column: x => x.ContactNavigationId,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "contacts_user_id_fkey",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "curator_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    surname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    thirdname = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("curator_profiles_pkey", x => x.id);
                    table.ForeignKey(
                        name: "FK_curator_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "employer_profiles",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    user_id = table.Column<int>(type: "integer", nullable: false),
                    company_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    inn = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    verification_data = table.Column<string>(type: "text", nullable: true),
                    verification_status = table.Column<string>(type: "text", nullable: false, defaultValue: "На рассмотрении"),
                    legal_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    profile_image = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    socials = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'[]'::jsonb"),
                    verification_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    media_content = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'[]'::jsonb")
                },
                constraints: table =>
                {
                    table.PrimaryKey("employer_profiles_pkey", x => x.id);
                    table.ForeignKey(
                        name: "FK_employer_profiles_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "tags",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    created_by = table.Column<int>(type: "integer", nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: true, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("tags_pkey", x => x.id);
                    table.ForeignKey(
                        name: "tags_created_by_fkey",
                        column: x => x.created_by,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "applicant_achievements",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    applicant_id = table.Column<int>(type: "integer", nullable: false),
                    obtain_date = table.Column<DateOnly>(type: "date", nullable: true),
                    location = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    description = table.Column<string>(type: "text", nullable: true),
                    attachments = table.Column<List<string>>(type: "character varying(500)[]", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("applicant_achievements_pkey", x => x.id);
                    table.ForeignKey(
                        name: "applicant_achievements_applicant_id_fkey",
                        column: x => x.applicant_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "applicant_educations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    applicant_id = table.Column<int>(type: "integer", nullable: false),
                    institution_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    faculty = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    specialization = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    start_year = table.Column<int>(type: "integer", nullable: true),
                    graduation_year = table.Column<int>(type: "integer", nullable: true),
                    is_completed = table.Column<bool>(type: "boolean", nullable: true, defaultValue: false),
                    attachments = table.Column<List<string>>(type: "character varying(500)[]", nullable: true),
                    description = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("applicant_educations_pkey", x => x.id);
                    table.ForeignKey(
                        name: "applicant_educations_applicant_id_fkey",
                        column: x => x.applicant_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    employer_id = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    description = table.Column<string>(type: "text", nullable: false),
                    location_address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    location_city = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    latitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    longitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    opportunity_type = table.Column<string>(type: "text", nullable: false),
                    publish_at = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    expire_at = table.Column<DateOnly>(type: "date", nullable: true),
                    deleted_at = table.Column<DateOnly>(type: "date", nullable: true),
                    contacts = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'{}'::jsonb"),
                    media_content = table.Column<string>(type: "jsonb", nullable: true, defaultValueSql: "'[]'::jsonb"),
                    search_vector = table.Column<NpgsqlTsVector>(type: "tsvector", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("opportunities_pkey", x => x.id);
                    table.ForeignKey(
                        name: "opportunities_employer_id_fkey",
                        column: x => x.employer_id,
                        principalTable: "employer_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "applications",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    opportunity_id = table.Column<int>(type: "integer", nullable: false),
                    applicant_id = table.Column<int>(type: "integer", nullable: false),
                    applied_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP"),
                    employer_note = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("applications_pkey", x => x.id);
                    table.ForeignKey(
                        name: "applications_applicant_id_fkey",
                        column: x => x.applicant_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "applications_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "opportunity_tags",
                columns: table => new
                {
                    opportunity_id = table.Column<int>(type: "integer", nullable: false),
                    tag_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("opportunity_tags_pkey", x => new { x.opportunity_id, x.tag_id });
                    table.ForeignKey(
                        name: "opportunity_tags_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "opportunity_tags_tag_id_fkey",
                        column: x => x.tag_id,
                        principalTable: "tags",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "recommendations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    recommender_id = table.Column<int>(type: "integer", nullable: false),
                    candidate_id = table.Column<int>(type: "integer", nullable: false),
                    opportunity_id = table.Column<int>(type: "integer", nullable: false),
                    message = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true, defaultValueSql: "CURRENT_TIMESTAMP")
                },
                constraints: table =>
                {
                    table.PrimaryKey("recommendations_pkey", x => x.id);
                    table.ForeignKey(
                        name: "recommendations_candidate_id_fkey",
                        column: x => x.candidate_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recommendations_opportunity_id_fkey",
                        column: x => x.opportunity_id,
                        principalTable: "opportunities",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "recommendations_recommender_id_fkey",
                        column: x => x.recommender_id,
                        principalTable: "applicant_profiles",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "idx_applicant_achievements_applicant_id",
                table: "applicant_achievements",
                column: "applicant_id");

            migrationBuilder.CreateIndex(
                name: "idx_applicant_educations_applicant_id",
                table: "applicant_educations",
                column: "applicant_id");

            migrationBuilder.CreateIndex(
                name: "applicant_profiles_user_id_key",
                table: "applicant_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_applicant_profiles_user_id",
                table: "applicant_profiles",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "applications_opportunity_id_applicant_id_key",
                table: "applications",
                columns: new[] { "opportunity_id", "applicant_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_applications_applicant_id",
                table: "applications",
                column: "applicant_id");

            migrationBuilder.CreateIndex(
                name: "idx_applications_opportunity_id",
                table: "applications",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "idx_contacts_contact_id",
                table: "contacts",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "idx_contacts_user_id",
                table: "contacts",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_ContactNavigationId",
                table: "contacts",
                column: "ContactNavigationId");

            migrationBuilder.CreateIndex(
                name: "curator_profiles_user_id_key",
                table: "curator_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "employer_profiles_user_id_key",
                table: "employer_profiles",
                column: "user_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_employer_profiles_user_id",
                table: "employer_profiles",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "idx_opportunities_employer_id",
                table: "opportunities",
                column: "employer_id");

            migrationBuilder.CreateIndex(
                name: "idx_opportunities_location_city",
                table: "opportunities",
                column: "location_city");

            migrationBuilder.CreateIndex(
                name: "idx_opportunities_publish_at",
                table: "opportunities",
                column: "publish_at");

            migrationBuilder.CreateIndex(
                name: "idx_opportunities_search_vector",
                table: "opportunities",
                column: "search_vector")
                .Annotation("Npgsql:IndexMethod", "gin");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity_tags_opportunity_id",
                table: "opportunity_tags",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "idx_opportunity_tags_tag_id",
                table: "opportunity_tags",
                column: "tag_id");

            migrationBuilder.CreateIndex(
                name: "idx_recommendations_opportunity_id",
                table: "recommendations",
                column: "opportunity_id");

            migrationBuilder.CreateIndex(
                name: "IX_recommendations_candidate_id",
                table: "recommendations",
                column: "candidate_id");

            migrationBuilder.CreateIndex(
                name: "IX_recommendations_recommender_id",
                table: "recommendations",
                column: "recommender_id");

            migrationBuilder.CreateIndex(
                name: "IX_tags_created_by",
                table: "tags",
                column: "created_by");

            migrationBuilder.CreateIndex(
                name: "tags_name_key",
                table: "tags",
                column: "name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "idx_users_deleted_at",
                table: "users",
                column: "deleted_at",
                filter: "(deleted_at IS NOT NULL)");

            migrationBuilder.CreateIndex(
                name: "users_email_key",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "applicant_achievements");

            migrationBuilder.DropTable(
                name: "applicant_educations");

            migrationBuilder.DropTable(
                name: "applications");

            migrationBuilder.DropTable(
                name: "contacts");

            migrationBuilder.DropTable(
                name: "curator_profiles");

            migrationBuilder.DropTable(
                name: "opportunity_tags");

            migrationBuilder.DropTable(
                name: "recommendations");

            migrationBuilder.DropTable(
                name: "tags");

            migrationBuilder.DropTable(
                name: "applicant_profiles");

            migrationBuilder.DropTable(
                name: "opportunities");

            migrationBuilder.DropTable(
                name: "employer_profiles");

            migrationBuilder.DropTable(
                name: "users");
        }
    }
}
