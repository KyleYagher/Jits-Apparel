using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Jits_Apparel.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StoreSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    VatRate = table.Column<decimal>(type: "numeric", nullable: false),
                    VatEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    VatNumber = table.Column<string>(type: "text", nullable: false),
                    StoreName = table.Column<string>(type: "text", nullable: false),
                    StoreEmail = table.Column<string>(type: "text", nullable: false),
                    StorePhone = table.Column<string>(type: "text", nullable: false),
                    StoreAddressLine1 = table.Column<string>(type: "text", nullable: false),
                    StoreAddressLine2 = table.Column<string>(type: "text", nullable: false),
                    StoreCity = table.Column<string>(type: "text", nullable: false),
                    StoreProvince = table.Column<string>(type: "text", nullable: false),
                    StorePostalCode = table.Column<string>(type: "text", nullable: false),
                    StoreCountry = table.Column<string>(type: "text", nullable: false),
                    FreeShippingThreshold = table.Column<decimal>(type: "numeric", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StoreSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StoreSettings");
        }
    }
}
