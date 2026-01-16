using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Jits_Apparel.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddShipLogicFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CarrierName",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveredDate",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceLevelCode",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceLevelName",
                table: "Orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ShipLogicShipmentId",
                table: "Orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ShippedDate",
                table: "Orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ShippingCost",
                table: "Orders",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CarrierName",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "DeliveredDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ServiceLevelCode",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ServiceLevelName",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShipLogicShipmentId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippedDate",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ShippingCost",
                table: "Orders");
        }
    }
}
