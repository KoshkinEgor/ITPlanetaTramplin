using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class scs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS recommendations_recommender_id_candidate_id_key;
                CREATE INDEX IF NOT EXISTS "IX_recommendations_recommender_id"
                ON recommendations (recommender_id);
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DROP INDEX IF EXISTS "IX_recommendations_recommender_id";
                CREATE UNIQUE INDEX IF NOT EXISTS recommendations_recommender_id_candidate_id_key
                ON recommendations (recommender_id, candidate_id);
                """);
        }
    }
}
