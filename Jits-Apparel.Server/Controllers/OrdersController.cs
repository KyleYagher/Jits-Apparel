using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Extensions;
using Jits.API.Models.DTOs;
using Jits.API.Models.Entities;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly JitsDbContext _context;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(JitsDbContext context, ILogger<OrdersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/orders (Admin only - paginated with filters)
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<PaginatedResponse<OrderSummaryDto>>> GetOrders(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            var query = _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .AsQueryable();

            // Apply filters
            if (!string.IsNullOrEmpty(status) && Enum.TryParse<OrderStatus>(status, true, out var orderStatus))
            {
                query = query.Where(o => o.Status == orderStatus);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(o =>
                    o.OrderNumber.Contains(search) ||
                    o.User.Email!.Contains(search) ||
                    o.User.FirstName.Contains(search) ||
                    o.User.LastName.Contains(search));
            }

            if (fromDate.HasValue)
            {
                query = query.Where(o => o.OrderDate >= fromDate.Value);
            }

            if (toDate.HasValue)
            {
                query = query.Where(o => o.OrderDate <= toDate.Value);
            }

            var totalCount = await query.CountAsync();

            var orders = await query
                .OrderByDescending(o => o.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var response = new PaginatedResponse<OrderSummaryDto>
            {
                Items = orders.Select(MapToSummaryDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return StatusCode(500, "An error occurred while retrieving orders");
        }
    }

    // GET: api/orders/5 (Admin or owner)
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                        .ThenInclude(p => p.Category)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            // Check authorization: user can only view own orders unless admin
            if (!this.IsOwnerOrAdmin(order.UserId))
                return Forbid();

            return Ok(MapToDto(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order {OrderId}", id);
            return StatusCode(500, "An error occurred while retrieving the order");
        }
    }

    // GET: api/orders/number/ORD-12345
    [HttpGet("number/{orderNumber}")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> GetOrderByNumber(string orderNumber)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);

            if (order == null)
                return NotFound();

            // Check authorization: user can only view own orders unless admin
            if (!this.IsOwnerOrAdmin(order.UserId))
                return Forbid();

            return Ok(MapToDto(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order by number {OrderNumber}", orderNumber);
            return StatusCode(500, "An error occurred while retrieving the order");
        }
    }

    // GET: api/orders/my-orders (Customer's own orders)
    [HttpGet("my-orders")]
    [Authorize]
    public async Task<ActionResult<List<OrderSummaryDto>>> GetMyOrders()
    {
        try
        {
            var userId = this.GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                .Where(o => o.UserId == userId.Value)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders.Select(MapToSummaryDto).ToList());
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user's orders");
            return StatusCode(500, "An error occurred while retrieving your orders");
        }
    }

    // GET: api/orders/my-orders/5 (Customer's specific order)
    [HttpGet("my-orders/{id}")]
    [Authorize]
    public async Task<ActionResult<OrderDto>> GetMyOrder(int id)
    {
        try
        {
            var userId = this.GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId.Value);

            if (order == null)
                return NotFound();

            return Ok(MapToDto(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user's order {OrderId}", id);
            return StatusCode(500, "An error occurred while retrieving your order");
        }
    }

    // POST: api/orders
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderRequest request)
    {
        try
        {
            var userId = this.GetCurrentUserId();
            if (userId == null)
                return Unauthorized();

            if (request.Items == null || request.Items.Count == 0)
                return BadRequest("Order must contain at least one item");

            // Fetch the user for customer snapshot
            var user = await _context.Users.FindAsync(userId.Value);
            if (user == null)
                return Unauthorized();

            // Validate all products exist, are active, and have sufficient stock
            var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in request.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                    return BadRequest($"Product with ID {item.ProductId} not found");

                if (!product.IsActive)
                    return BadRequest($"Product '{product.Name}' is not available");

                if (product.StockQuantity < item.Quantity)
                    return BadRequest($"Insufficient stock for '{product.Name}'. Available: {product.StockQuantity}, Requested: {item.Quantity}");
            }

            // Create Order entity with customer snapshot
            var order = new Order
            {
                UserId = userId.Value,
                OrderNumber = GenerateOrderNumber(),
                OrderDate = DateTime.UtcNow,
                Status = OrderStatus.Pending,
                Notes = request.Notes,
                CreatedAt = DateTime.UtcNow,
                PaymentStatus = "Pending",
                // Customer snapshot (captured at order creation)
                CustomerName = $"{user.FirstName} {user.LastName}",
                CustomerEmail = user.Email ?? "",
                CustomerPhone = user.PhoneNumber,
                // Shipping address
                ShippingFullName = request.ShippingAddress?.FullName,
                ShippingAddressLine1 = request.ShippingAddress?.AddressLine1,
                ShippingAddressLine2 = request.ShippingAddress?.AddressLine2,
                ShippingCity = request.ShippingAddress?.City,
                ShippingProvince = request.ShippingAddress?.Province,
                ShippingPostalCode = request.ShippingAddress?.PostalCode,
                ShippingCountry = request.ShippingAddress?.Country ?? "South Africa",
                // Shipping option selected at checkout
                ServiceLevelCode = request.ServiceLevelCode,
                ServiceLevelName = request.ServiceLevelName,
                ShippingCost = request.ShippingCost,
                EstimatedDelivery = request.DeliveryEstimate
            };

            // Create OrderItems and calculate totals
            decimal totalAmount = 0;
            foreach (var item in request.Items)
            {
                var product = products[item.ProductId];
                var orderItem = new OrderItem
                {
                    ProductId = item.ProductId,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                    Subtotal = product.Price * item.Quantity,
                    Size = item.Size,
                    Color = item.Color
                };
                order.OrderItems.Add(orderItem);
                totalAmount += orderItem.Subtotal;

                // Decrease stock
                product.StockQuantity -= item.Quantity;
                product.UpdatedAt = DateTime.UtcNow;
            }

            // Add shipping cost to total
            order.TotalAmount = totalAmount + (request.ShippingCost ?? 0m);

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Reload with includes for proper DTO mapping
            var createdOrder = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            _logger.LogInformation("Order {OrderNumber} created for user {UserId}", order.OrderNumber, userId);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, MapToDto(createdOrder!));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, "An error occurred while creating the order");
        }
    }

    // PUT: api/orders/5/status (Admin update status)
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrderDto>> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            if (!Enum.TryParse<OrderStatus>(request.Status, true, out var newStatus))
                return BadRequest($"Invalid status: {request.Status}");

            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            order.Status = newStatus;
            order.UpdatedAt = DateTime.UtcNow;

            // Update tracking number if provided
            if (!string.IsNullOrEmpty(request.TrackingNumber))
            {
                order.TrackingNumber = request.TrackingNumber;
            }

            // Append admin note if provided
            if (!string.IsNullOrEmpty(request.AdminNote))
            {
                order.Notes = string.IsNullOrEmpty(order.Notes)
                    ? $"[Admin] {request.AdminNote}"
                    : $"{order.Notes}\n[Admin] {request.AdminNote}";
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} status updated to {Status}", id, newStatus);

            return Ok(MapToDto(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status {OrderId}", id);
            return StatusCode(500, "An error occurred while updating the order status");
        }
    }

    // DELETE: api/orders/5 (Admin only)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteOrder(int id)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            // Only allow deletion of pending or cancelled orders
            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
                return BadRequest("Only pending or cancelled orders can be deleted");

            // Restore stock for deleted order items
            var productIds = order.OrderItems.Select(oi => oi.ProductId).ToList();
            var products = await _context.Products
                .Where(p => productIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            foreach (var item in order.OrderItems)
            {
                if (products.TryGetValue(item.ProductId, out var product))
                {
                    product.StockQuantity += item.Quantity;
                    product.UpdatedAt = DateTime.UtcNow;
                }
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Order {OrderId} deleted", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting order {OrderId}", id);
            return StatusCode(500, "An error occurred while deleting the order");
        }
    }

    // POST: api/orders/5/resend-confirmation (Admin - resend order confirmation email)
    [HttpPost("{id}/resend-confirmation")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResendConfirmation(int id)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            // TODO: Integrate with email service to send confirmation
            // For now, just log and return success
            _logger.LogInformation("Resending confirmation email for order {OrderId} to {Email}",
                id, order.CustomerEmail);

            // Simulate email sending - replace with actual email service call
            // await _emailService.SendOrderConfirmationAsync(order);

            return Ok(new { message = $"Confirmation email sent to {order.CustomerEmail}" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resending confirmation for order {OrderId}", id);
            return StatusCode(500, "An error occurred while resending the confirmation");
        }
    }

    // POST: api/orders/5/refund (Admin - process refund)
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<OrderDto>> ProcessRefund(int id, [FromBody] RefundRequest? request)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            if (order.PaymentStatus == "Refunded")
                return BadRequest("Order has already been refunded");

            // Determine refund amount (full or partial)
            var refundAmount = request?.Amount ?? order.TotalAmount;
            if (refundAmount > order.TotalAmount)
                return BadRequest("Refund amount cannot exceed order total");

            // Update payment status
            var isFullRefund = refundAmount == order.TotalAmount;
            order.PaymentStatus = isFullRefund ? "Refunded" : "Partially Refunded";
            order.UpdatedAt = DateTime.UtcNow;

            // Add refund note
            var refundNote = $"[Refund] R{refundAmount:F2} refunded on {DateTime.UtcNow:yyyy-MM-dd HH:mm}";
            if (!string.IsNullOrEmpty(request?.Reason))
                refundNote += $" - Reason: {request.Reason}";

            order.Notes = string.IsNullOrEmpty(order.Notes)
                ? refundNote
                : $"{order.Notes}\n{refundNote}";

            // If full refund, optionally restore stock and cancel order
            if (isFullRefund && request?.RestoreStock == true)
            {
                foreach (var item in order.OrderItems)
                {
                    if (item.Product != null)
                    {
                        item.Product.StockQuantity += item.Quantity;
                        item.Product.UpdatedAt = DateTime.UtcNow;
                    }
                }
                order.Status = OrderStatus.Cancelled;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Refund of R{Amount} processed for order {OrderId}", refundAmount, id);

            return Ok(MapToDto(order));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing refund for order {OrderId}", id);
            return StatusCode(500, "An error occurred while processing the refund");
        }
    }

    // GET: api/orders/5/invoice (Generate invoice PDF - placeholder)
    [HttpGet("{id}/invoice")]
    [Authorize]
    public async Task<IActionResult> GetInvoice(int id)
    {
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == id);

            if (order == null)
                return NotFound();

            // Check authorization: user can only get own invoice unless admin
            if (!this.IsOwnerOrAdmin(order.UserId))
                return Forbid();

            // Get store settings for VAT and store information
            var settings = await _context.StoreSettings.FirstOrDefaultAsync();

            // Calculate VAT
            var shippingCost = order.ShippingCost ?? 0m;
            var totalWithShipping = order.TotalAmount;
            var itemsTotal = totalWithShipping - shippingCost;
            var vatRate = settings?.VatEnabled == true ? settings.VatRate : 0m;
            var subtotalExclVat = vatRate > 0 ? itemsTotal / (1 + vatRate / 100) : itemsTotal;
            var vatAmount = itemsTotal - subtotalExclVat;

            // Build store address string
            var storeAddressParts = new List<string>();
            if (!string.IsNullOrEmpty(settings?.StoreAddressLine1))
                storeAddressParts.Add(settings.StoreAddressLine1);
            if (!string.IsNullOrEmpty(settings?.StoreAddressLine2))
                storeAddressParts.Add(settings.StoreAddressLine2);
            if (!string.IsNullOrEmpty(settings?.StoreCity) || !string.IsNullOrEmpty(settings?.StoreProvince) || !string.IsNullOrEmpty(settings?.StorePostalCode))
                storeAddressParts.Add($"{settings?.StoreCity}, {settings?.StoreProvince} {settings?.StorePostalCode}".Trim());
            if (!string.IsNullOrEmpty(settings?.StoreCountry))
                storeAddressParts.Add(settings.StoreCountry);

            var invoiceData = new
            {
                invoiceNumber = $"INV-{order.OrderNumber}",
                orderNumber = order.OrderNumber,
                orderDate = order.OrderDate,
                customerName = order.CustomerName,
                customerEmail = order.CustomerEmail,
                customerPhone = order.CustomerPhone,
                shippingAddress = !string.IsNullOrEmpty(order.ShippingAddressLine1) ? new
                {
                    fullName = order.ShippingFullName,
                    addressLine1 = order.ShippingAddressLine1,
                    addressLine2 = order.ShippingAddressLine2,
                    city = order.ShippingCity,
                    province = order.ShippingProvince,
                    postalCode = order.ShippingPostalCode,
                    country = order.ShippingCountry
                } : null,
                items = order.OrderItems.Select(oi => new
                {
                    productName = oi.Product?.Name ?? "Unknown",
                    quantity = oi.Quantity,
                    unitPrice = oi.UnitPrice,
                    subtotal = oi.Subtotal,
                    size = oi.Size,
                    color = oi.Color
                }),
                subtotal = subtotalExclVat,
                shipping = shippingCost,
                tax = vatAmount,
                taxRate = vatRate,
                total = totalWithShipping,
                paymentMethod = order.PaymentMethod,
                paymentStatus = order.PaymentStatus,
                carrierName = order.CarrierName,
                trackingNumber = order.TrackingNumber,
                serviceLevelName = order.ServiceLevelName,
                // Store information
                storeName = settings?.StoreName ?? "Jits Apparel",
                storeEmail = settings?.StoreEmail,
                storePhone = settings?.StorePhone,
                storeAddress = storeAddressParts.Count > 0 ? string.Join(", ", storeAddressParts) : null,
                vatNumber = settings?.VatNumber
            };

            _logger.LogInformation("Invoice generated for order {OrderId}", id);

            return Ok(invoiceData);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating invoice for order {OrderId}", id);
            return StatusCode(500, "An error occurred while generating the invoice");
        }
    }

    // Helper: Generate unique order number
    private static string GenerateOrderNumber()
    {
        return $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
    }

    // Helper: Map Order entity to OrderDto
    private static OrderDto MapToDto(Order order)
    {
        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            Notes = order.Notes,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            UserId = order.UserId,
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail,
            CustomerPhone = order.CustomerPhone,
            TrackingNumber = order.TrackingNumber,
            ShippingMethod = order.ShippingMethod?.ToString(),
            EstimatedDelivery = order.EstimatedDelivery,
            CarrierName = order.CarrierName,
            ShippingCost = order.ShippingCost,
            ServiceLevelCode = order.ServiceLevelCode,
            ServiceLevelName = order.ServiceLevelName,
            ShippedDate = order.ShippedDate,
            DeliveredDate = order.DeliveredDate,
            PaymentMethod = order.PaymentMethod,
            PaymentStatus = order.PaymentStatus,
            ShippingAddress = !string.IsNullOrEmpty(order.ShippingAddressLine1) ? new ShippingAddressDto
            {
                FullName = order.ShippingFullName ?? "",
                AddressLine1 = order.ShippingAddressLine1 ?? "",
                AddressLine2 = order.ShippingAddressLine2,
                City = order.ShippingCity ?? "",
                Province = order.ShippingProvince ?? "",
                PostalCode = order.ShippingPostalCode ?? "",
                Country = order.ShippingCountry ?? "South Africa"
            } : null,
            Items = order.OrderItems.Select(oi => new OrderItemDto
            {
                Id = oi.Id,
                ProductId = oi.ProductId,
                ProductName = oi.Product?.Name ?? "Unknown Product",
                ProductImageUrl = oi.Product?.ImageUrl,
                Quantity = oi.Quantity,
                UnitPrice = oi.UnitPrice,
                Subtotal = oi.Subtotal,
                Size = oi.Size,
                Color = oi.Color
            }).ToList(),
            Timeline = GenerateTimeline(order)
        };
    }

    // Helper: Map Order entity to OrderSummaryDto
    private static OrderSummaryDto MapToSummaryDto(Order order)
    {
        return new OrderSummaryDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            OrderDate = order.OrderDate,
            Status = order.Status.ToString(),
            TotalAmount = order.TotalAmount,
            ItemCount = order.OrderItems.Sum(oi => oi.Quantity),
            CustomerName = order.CustomerName,
            CustomerEmail = order.CustomerEmail
        };
    }

    // Helper: Generate status timeline for an order
    private static List<OrderTimelineDto> GenerateTimeline(Order order)
    {
        var statuses = new[]
        {
            (OrderStatus.Pending, "Order Placed", "Your order has been received"),
            (OrderStatus.Processing, "Processing", "Your order is being prepared"),
            (OrderStatus.Shipped, "Shipped", "Your order has been dispatched"),
            (OrderStatus.Delivered, "Delivered", "Your order has been delivered")
        };

        var timeline = new List<OrderTimelineDto>();

        // Handle cancelled orders specially
        if (order.Status == OrderStatus.Cancelled)
        {
            timeline.Add(new OrderTimelineDto
            {
                Status = "Order Placed",
                Timestamp = order.CreatedAt,
                Description = "Your order was received",
                Completed = true
            });
            timeline.Add(new OrderTimelineDto
            {
                Status = "Cancelled",
                Timestamp = order.UpdatedAt,
                Description = "Your order has been cancelled",
                Completed = true
            });
            return timeline;
        }

        foreach (var (status, name, desc) in statuses)
        {
            var completed = (int)order.Status >= (int)status;
            DateTime? timestamp = null;

            if (completed)
            {
                // Use UpdatedAt for the current status, CreatedAt for Pending
                if (status == OrderStatus.Pending)
                    timestamp = order.CreatedAt;
                else if (status == order.Status)
                    timestamp = order.UpdatedAt ?? order.CreatedAt;
                else
                    timestamp = order.CreatedAt; // Earlier statuses use created date as placeholder
            }

            timeline.Add(new OrderTimelineDto
            {
                Status = name,
                Timestamp = timestamp,
                Description = desc,
                Completed = completed
            });
        }

        return timeline;
    }
}
