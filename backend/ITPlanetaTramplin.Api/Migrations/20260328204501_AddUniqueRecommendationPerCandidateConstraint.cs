using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueRecommendationPerCandidateConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_recommendations_recommender_id",
                table: "recommendations");

            migrationBuilder.CreateIndex(
                name: "recommendations_recommender_id_candidate_id_key",
                table: "recommendations",
                columns: new[] { "recommender_id", "candidate_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "recommendations_recommender_id_candidate_id_key",
                table: "recommendations");

            migrationBuilder.CreateIndex(
                name: "IX_recommendations_recommender_id",
                table: "recommendations",
                column: "recommender_id");
        }
    }
}
