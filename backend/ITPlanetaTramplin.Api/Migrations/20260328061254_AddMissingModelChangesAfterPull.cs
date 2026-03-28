using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ITPlanetaTramplin.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingModelChangesAfterPull : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // This migration was generated after a pull, but it duplicates schema that was
            // already introduced by 20260328054233_AddFriendRequestsAndProjectInvites.
            // Keep it as a no-op so databases can advance through the migration chain safely.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No-op on purpose. The duplicated schema is owned by the previous migration.
        }
    }
}
