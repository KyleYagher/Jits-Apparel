using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Models.DTOs;
using Jits.API.Services;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShippingController : ControllerBase
{
    private readonly IShippingService _shippingService;
    private readonly JitsDbContext _dbContext;
    private readonly ILogger<ShippingController> _logger;

    public ShippingController(
        IShippingService shippingService,
        JitsDbContext dbContext,
        ILogger<ShippingController> logger)
    {
        _shippingService = shippingService;
        _dbContext = dbContext;
        _logger = logger;
    }

    /// <summary>
    /// Get available shipping rates for a delivery address
    /// </summary>
    /// <param name="request">Delivery address and parcel details</param>
    /// <returns>Available shipping rates</returns>
    [HttpPost("rates")]
    [Authorize]
    public async Task<ActionResult<ShippingRatesResponse>> GetRates([FromBody] GetShippingRatesRequest request)
    {
        try
        {
            // Validate request
            if (request.DeliveryAddress == null)
            {
                return BadRequest("Delivery address is required");
            }

            if (request.Parcels == null || request.Parcels.Count == 0)
            {
                // Use default parcel dimensions for apparel if not specified
                request.Parcels = new List<ParcelDto>
                {
                    new ParcelDto
                    {
                        LengthCm = 35,
                        WidthCm = 25,
                        HeightCm = 5,
                        WeightKg = 0.5m,
                        Description = "Apparel"
                    }
                };
            }

            // Calculate order subtotal from declared value if provided
            var orderSubtotal = request.DeclaredValue ?? 0;

            var rates = await _shippingService.GetRatesAsync(request, orderSubtotal);
            return Ok(rates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipping rates");
            return StatusCode(500, new { message = "Failed to get shipping rates. Please try again." });
        }
    }

    /// <summary>
    /// Get shipping rates for an existing order (admin use)
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Available shipping rates</returns>
    [HttpGet("rates/order/{orderId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShippingRatesResponse>> GetRatesForOrder(int orderId)
    {
        try
        {
            var order = await _dbContext.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            // Build the rate request from order details
            var request = new GetShippingRatesRequest
            {
                DeliveryAddress = new ShippingAddressDto
                {
                    FullName = order.ShippingFullName ?? order.CustomerName,
                    AddressLine1 = order.ShippingAddressLine1 ?? "",
                    AddressLine2 = order.ShippingAddressLine2,
                    City = order.ShippingCity ?? "",
                    Province = order.ShippingProvince ?? "",
                    PostalCode = order.ShippingPostalCode ?? "",
                    Country = order.ShippingCountry ?? "South Africa"
                },
                Parcels = CalculateParcelsFromOrder(order),
                DeclaredValue = order.TotalAmount
            };

            var rates = await _shippingService.GetRatesAsync(request, order.TotalAmount);
            return Ok(rates);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipping rates for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to get shipping rates" });
        }
    }

    /// <summary>
    /// Create a shipment for an order (admin only)
    /// </summary>
    /// <param name="request">Shipment creation request</param>
    /// <returns>Created shipment details</returns>
    [HttpPost("shipments")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ShipmentResponse>> CreateShipment([FromBody] CreateShipmentRequest request)
    {
        try
        {
            // Validate the order exists and hasn't been shipped
            var order = await _dbContext.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (!string.IsNullOrEmpty(order.TrackingNumber))
            {
                return BadRequest("Order already has a shipment. Cancel the existing shipment first.");
            }

            // Use default parcels if not specified
            if (request.Parcels == null || request.Parcels.Count == 0)
            {
                request.Parcels = CalculateParcelsFromOrder(order);
            }

            var shipment = await _shippingService.CreateShipmentAsync(request);
            return Ok(shipment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment for order {OrderId}", request.OrderId);
            return StatusCode(500, new { message = $"Failed to create shipment: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get tracking information for a shipment
    /// </summary>
    /// <param name="trackingReference">Tracking reference</param>
    /// <returns>Tracking information</returns>
    [HttpGet("tracking/{trackingReference}")]
    public async Task<ActionResult<TrackingResponse>> GetTracking(string trackingReference)
    {
        try
        {
            var tracking = await _shippingService.GetTrackingAsync(trackingReference);
            return Ok(tracking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tracking for {TrackingReference}", trackingReference);
            return StatusCode(500, new { message = "Failed to get tracking information" });
        }
    }

    /// <summary>
    /// Get tracking information for an order
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Tracking information</returns>
    [HttpGet("tracking/order/{orderId}")]
    [Authorize]
    public async Task<ActionResult<TrackingResponse>> GetTrackingForOrder(int orderId)
    {
        try
        {
            var order = await _dbContext.Orders.FindAsync(orderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            // Verify the user owns this order or is admin
            var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && order.UserId.ToString() != userId)
            {
                return Forbid();
            }

            if (string.IsNullOrEmpty(order.TrackingNumber))
            {
                return NotFound("No tracking available for this order yet");
            }

            var tracking = await _shippingService.GetTrackingAsync(order.TrackingNumber);
            return Ok(tracking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tracking for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to get tracking information" });
        }
    }

    /// <summary>
    /// Get shipping label URL for a shipment (admin only)
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Label URL</returns>
    [HttpGet("label/{orderId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> GetLabel(int orderId)
    {
        try
        {
            var order = await _dbContext.Orders.FindAsync(orderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (!order.ShipLogicShipmentId.HasValue)
            {
                return NotFound("No shipment found for this order");
            }

            var labelUrl = await _shippingService.GetLabelUrlAsync(order.ShipLogicShipmentId.Value);
            return Ok(new { url = labelUrl });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting label for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to get shipping label" });
        }
    }

    /// <summary>
    /// Cancel a shipment (admin only)
    /// </summary>
    /// <param name="orderId">Order ID</param>
    /// <returns>Success status</returns>
    [HttpPost("cancel/{orderId}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> CancelShipment(int orderId)
    {
        try
        {
            var order = await _dbContext.Orders.FindAsync(orderId);

            if (order == null)
            {
                return NotFound("Order not found");
            }

            if (string.IsNullOrEmpty(order.TrackingNumber))
            {
                return BadRequest("No shipment to cancel");
            }

            var success = await _shippingService.CancelShipmentAsync(order.TrackingNumber);

            if (success)
            {
                order.TrackingNumber = null;
                order.ShipLogicShipmentId = null;
                order.ShippingCost = null;
                order.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();

                return Ok(new { message = "Shipment cancelled successfully" });
            }

            return BadRequest("Failed to cancel shipment. It may have already been collected.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling shipment for order {OrderId}", orderId);
            return StatusCode(500, new { message = "Failed to cancel shipment" });
        }
    }

    /// <summary>
    /// Webhook endpoint for Ship Logic tracking updates
    /// </summary>
    /// <param name="payload">Webhook payload</param>
    /// <returns>Acknowledgment</returns>
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<ActionResult> Webhook([FromBody] ShipLogicWebhookPayload payload)
    {
        try
        {
            _logger.LogInformation(
                "Received Ship Logic webhook: ShipmentId={ShipmentId}, Status={Status}",
                payload.ShipmentId, payload.Status);

            var success = await _shippingService.ProcessWebhookAsync(payload);

            return success ? Ok() : StatusCode(500);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Ship Logic webhook");
            return StatusCode(500);
        }
    }

    #region Helper Methods

    /// <summary>
    /// Calculate parcel dimensions from order items
    /// </summary>
    private List<ParcelDto> CalculateParcelsFromOrder(Jits.API.Models.Entities.Order order)
    {
        // For apparel, we can estimate based on item count
        var itemCount = order.OrderItems.Sum(oi => oi.Quantity);

        // Base dimensions for a single apparel item
        const decimal baseLength = 35m;
        const decimal baseWidth = 25m;
        const decimal baseHeightPerItem = 3m;
        const decimal baseWeightPerItem = 0.3m;

        // Calculate dimensions based on item count
        // Stack items vertically
        var height = Math.Min(baseHeightPerItem * itemCount, 50m); // Max 50cm height
        var weight = baseWeightPerItem * itemCount;

        // If many items, might need multiple parcels
        var parcels = new List<ParcelDto>();
        var remainingItems = itemCount;
        const int maxItemsPerParcel = 10;

        while (remainingItems > 0)
        {
            var itemsInParcel = Math.Min(remainingItems, maxItemsPerParcel);
            parcels.Add(new ParcelDto
            {
                LengthCm = baseLength,
                WidthCm = baseWidth,
                HeightCm = Math.Max(5, baseHeightPerItem * itemsInParcel),
                WeightKg = Math.Max(0.5m, baseWeightPerItem * itemsInParcel),
                Description = $"Jits Apparel ({itemsInParcel} items)"
            });
            remainingItems -= itemsInParcel;
        }

        return parcels;
    }

    #endregion
}
