using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Extensions;
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

    // GET: api/orders
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
    {
        try
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();

            return Ok(orders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving orders");
            return StatusCode(500, "An error occurred while retrieving orders");
        }
    }

    // GET: api/orders/5
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<Order>> GetOrder(int id)
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

            return Ok(order);
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
    public async Task<ActionResult<Order>> GetOrderByNumber(string orderNumber)
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

            return Ok(order);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving order by number {OrderNumber}", orderNumber);
            return StatusCode(500, "An error occurred while retrieving the order");
        }
    }

    // POST: api/orders
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<Order>> CreateOrder(Order order)
    {
        try
        {
            // Verify user exists
            if (!await _context.Users.AnyAsync(u => u.Id == order.UserId))
                return BadRequest("User not found");

            // Generate order number if not provided
            if (string.IsNullOrEmpty(order.OrderNumber))
            {
                order.OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}";
            }

            // Set timestamps
            order.CreatedAt = DateTime.UtcNow;
            order.OrderDate = DateTime.UtcNow;

            // Calculate total amount from order items
            decimal totalAmount = 0;
            foreach (var item in order.OrderItems)
            {
                // Verify product exists and get current price
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                    return BadRequest($"Product with ID {item.ProductId} not found");

                item.UnitPrice = product.Price;
                item.Subtotal = item.Quantity * item.UnitPrice;
                totalAmount += item.Subtotal;
            }

            order.TotalAmount = totalAmount;
            order.Status = OrderStatus.Pending;

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            // Reload with includes
            var createdOrder = await _context.Orders
                .Include(o => o.User)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == order.Id);

            return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, createdOrder);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating order");
            return StatusCode(500, "An error occurred while creating the order");
        }
    }

    // PUT: api/orders/5/status
    [HttpPut("{id}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderStatus status)
    {
        try
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            order.Status = status;
            order.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating order status {OrderId}", id);
            return StatusCode(500, "An error occurred while updating the order status");
        }
    }

    // DELETE: api/orders/5
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

            // Only allow deletion of pending orders
            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
                return BadRequest("Only pending or cancelled orders can be deleted");

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting order {OrderId}", id);
            return StatusCode(500, "An error occurred while deleting the order");
        }
    }
}
