using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Models.DTOs;
using Jits.API.Models.Entities;
using System.Text;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AnalyticsController : ControllerBase
{
    private readonly JitsDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    // Stock thresholds
    private const int LowStockThreshold = 20;
    private const int CriticalStockThreshold = 10;

    // Category colors for charts
    private static readonly string[] CategoryColors = new[]
    {
        "#ec4899", "#f97316", "#eab308", "#06b6d4", "#8b5cf6", "#10b981", "#ef4444", "#3b82f6"
    };

    public AnalyticsController(JitsDbContext context, ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/analytics/dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult<AnalyticsDashboardDto>> GetDashboard(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "daily")
    {
        try
        {
            // Default to last 30 days if no dates provided
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);
            var periodLength = (endDate - startDate).Days;

            // Previous period for comparison
            var prevEndDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            var prevStartDate = DateTime.SpecifyKind(prevEndDate.AddDays(-periodLength), DateTimeKind.Utc);

            _logger.LogInformation("Fetching analytics dashboard from {StartDate} to {EndDate}", startDate, endDate);

            var dashboard = new AnalyticsDashboardDto();

            try { dashboard.Summary = await GetSummaryAsync(startDate, endDate, prevStartDate, prevEndDate); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetSummaryAsync"); throw; }

            try { dashboard.RevenueOverTime = await GetRevenueOverTimeAsync(startDate, endDate, granularity); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetRevenueOverTimeAsync"); throw; }

            try { dashboard.OrderVolumeOverTime = await GetOrderVolumeOverTimeAsync(startDate, endDate, granularity); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetOrderVolumeOverTimeAsync"); throw; }

            try { dashboard.SalesByCategory = await GetSalesByCategoryAsync(startDate, endDate); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetSalesByCategoryAsync"); throw; }

            try { dashboard.TopProducts = await GetTopProductsAsync(startDate, endDate, 10); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetTopProductsAsync"); throw; }

            try { dashboard.InventoryInsights = await GetInventoryInsightsAsync(startDate, endDate); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetInventoryInsightsAsync"); throw; }

            try { dashboard.CustomerAnalytics = await GetCustomerAnalyticsAsync(startDate, endDate); }
            catch (Exception ex) { _logger.LogError(ex, "Error in GetCustomerAnalyticsAsync"); throw; }

            return Ok(dashboard);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating analytics dashboard");
            return StatusCode(500, $"An error occurred while generating the analytics dashboard: {ex.Message}");
        }
    }

    // GET: api/analytics/summary
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);
            var periodLength = (endDate - startDate).Days;

            var prevEndDate = DateTime.SpecifyKind(startDate.Date, DateTimeKind.Utc);
            var prevStartDate = DateTime.SpecifyKind(prevEndDate.AddDays(-periodLength), DateTimeKind.Utc);

            var summary = await GetSummaryAsync(startDate, endDate, prevStartDate, prevEndDate);
            return Ok(summary);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating analytics summary");
            return StatusCode(500, "An error occurred while generating the summary");
        }
    }

    // GET: api/analytics/revenue
    [HttpGet("revenue")]
    public async Task<ActionResult<List<RevenueDataPointDto>>> GetRevenue(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "daily")
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            var data = await GetRevenueOverTimeAsync(startDate, endDate, granularity);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating revenue data");
            return StatusCode(500, "An error occurred while generating revenue data");
        }
    }

    // GET: api/analytics/orders
    [HttpGet("orders")]
    public async Task<ActionResult<List<OrderVolumeDataPointDto>>> GetOrderVolume(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string granularity = "daily")
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            var data = await GetOrderVolumeOverTimeAsync(startDate, endDate, granularity);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating order volume data");
            return StatusCode(500, "An error occurred while generating order volume data");
        }
    }

    // GET: api/analytics/products/top
    [HttpGet("products/top")]
    public async Task<ActionResult<List<TopProductDto>>> GetTopProducts(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] int limit = 10)
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            var data = await GetTopProductsAsync(startDate, endDate, limit);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating top products data");
            return StatusCode(500, "An error occurred while generating top products data");
        }
    }

    // GET: api/analytics/categories
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategorySalesDto>>> GetCategorySales(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            var data = await GetSalesByCategoryAsync(startDate, endDate);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating category sales data");
            return StatusCode(500, "An error occurred while generating category sales data");
        }
    }

    // GET: api/analytics/inventory
    [HttpGet("inventory")]
    public async Task<ActionResult<InventoryInsightsDto>> GetInventoryInsights(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-90), DateTimeKind.Utc);

            var data = await GetInventoryInsightsAsync(startDate, endDate);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating inventory insights");
            return StatusCode(500, "An error occurred while generating inventory insights");
        }
    }

    // GET: api/analytics/customers
    [HttpGet("customers")]
    public async Task<ActionResult<CustomerAnalyticsDto>> GetCustomerAnalytics(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            var data = await GetCustomerAnalyticsAsync(startDate, endDate);
            return Ok(data);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating customer analytics");
            return StatusCode(500, "An error occurred while generating customer analytics");
        }
    }

    // GET: api/analytics/export/csv
    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv(
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null,
        [FromQuery] string type = "orders")
    {
        try
        {
            // Ensure all dates are UTC for PostgreSQL compatibility
            var endDate = DateTime.SpecifyKind(toDate?.Date.AddDays(1) ?? DateTime.UtcNow.Date.AddDays(1), DateTimeKind.Utc);
            var startDate = DateTime.SpecifyKind(fromDate?.Date ?? endDate.AddDays(-30), DateTimeKind.Utc);

            string csv;
            string filename;

            switch (type.ToLower())
            {
                case "orders":
                    csv = await GenerateOrdersCsvAsync(startDate, endDate);
                    filename = $"orders-export-{startDate:yyyy-MM-dd}-to-{endDate.AddDays(-1):yyyy-MM-dd}.csv";
                    break;
                case "revenue":
                    csv = await GenerateRevenueCsvAsync(startDate, endDate);
                    filename = $"revenue-export-{startDate:yyyy-MM-dd}-to-{endDate.AddDays(-1):yyyy-MM-dd}.csv";
                    break;
                case "products":
                    csv = await GenerateProductsCsvAsync(startDate, endDate);
                    filename = $"products-export-{startDate:yyyy-MM-dd}-to-{endDate.AddDays(-1):yyyy-MM-dd}.csv";
                    break;
                case "customers":
                    csv = await GenerateCustomersCsvAsync(startDate, endDate);
                    filename = $"customers-export-{startDate:yyyy-MM-dd}-to-{endDate.AddDays(-1):yyyy-MM-dd}.csv";
                    break;
                default:
                    return BadRequest("Invalid export type. Use: orders, revenue, products, or customers");
            }

            var bytes = Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", filename);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error exporting analytics data");
            return StatusCode(500, "An error occurred while exporting data");
        }
    }

    #region Private Helper Methods

    private async Task<AnalyticsSummaryDto> GetSummaryAsync(
        DateTime startDate, DateTime endDate,
        DateTime prevStartDate, DateTime prevEndDate)
    {
        // Current period orders (excluding cancelled)
        var currentOrders = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        // Previous period orders
        var prevOrders = await _context.Orders
            .Where(o => o.OrderDate >= prevStartDate && o.OrderDate < prevEndDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var totalRevenue = currentOrders.Sum(o => o.TotalAmount);
        var prevRevenue = prevOrders.Sum(o => o.TotalAmount);

        var totalOrders = currentOrders.Count;
        var prevOrdersCount = prevOrders.Count;

        var aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        var prevAov = prevOrdersCount > 0 ? prevRevenue / prevOrdersCount : 0;

        // Customer metrics
        var currentCustomerIds = currentOrders.Select(o => o.UserId).Distinct().ToList();
        var prevCustomerIds = prevOrders.Select(o => o.UserId).Distinct().ToList();

        // Get all orders for these customers to determine new vs returning - load into memory first
        var ordersForCurrentCustomers = await _context.Orders
            .Where(o => currentCustomerIds.Contains(o.UserId))
            .ToListAsync();

        var firstOrderDates = ordersForCurrentCustomers
            .GroupBy(o => o.UserId)
            .ToDictionary(g => g.Key, g => g.Min(o => o.OrderDate));

        var newCustomers = currentCustomerIds.Count(id =>
            firstOrderDates.TryGetValue(id, out var firstOrder) && firstOrder >= startDate);
        var returningCustomers = currentCustomerIds.Count - newCustomers;

        var retentionRate = currentCustomerIds.Count > 0
            ? (decimal)returningCustomers / currentCustomerIds.Count * 100
            : 0;

        // Previous period retention - load into memory first
        var ordersForPrevCustomers = await _context.Orders
            .Where(o => prevCustomerIds.Contains(o.UserId))
            .ToListAsync();

        var prevFirstOrderDates = ordersForPrevCustomers
            .GroupBy(o => o.UserId)
            .ToDictionary(g => g.Key, g => g.Min(o => o.OrderDate));

        var prevNewCustomers = prevCustomerIds.Count(id =>
            prevFirstOrderDates.TryGetValue(id, out var firstOrder) && firstOrder >= prevStartDate);
        var prevReturning = prevCustomerIds.Count - prevNewCustomers;
        var prevRetentionRate = prevCustomerIds.Count > 0
            ? (decimal)prevReturning / prevCustomerIds.Count * 100
            : 0;

        // Products sold - use nullable sum to handle empty sequences
        var productsSold = await _context.OrderItems
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate < endDate)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .SumAsync(oi => (int?)oi.Quantity) ?? 0;

        return new AnalyticsSummaryDto
        {
            TotalRevenue = totalRevenue,
            PreviousPeriodRevenue = prevRevenue,
            RevenueChangePercent = prevRevenue > 0 ? (totalRevenue - prevRevenue) / prevRevenue * 100 : 0,

            TotalOrders = totalOrders,
            PreviousPeriodOrders = prevOrdersCount,
            OrdersChangePercent = prevOrdersCount > 0 ? (decimal)(totalOrders - prevOrdersCount) / prevOrdersCount * 100 : 0,

            AverageOrderValue = aov,
            PreviousAverageOrderValue = prevAov,
            AovChangePercent = prevAov > 0 ? (aov - prevAov) / prevAov * 100 : 0,

            TotalCustomers = currentCustomerIds.Count,
            NewCustomers = newCustomers,
            ReturningCustomers = returningCustomers,
            CustomerRetentionRate = retentionRate,
            PreviousRetentionRate = prevRetentionRate,
            RetentionChangePercent = prevRetentionRate > 0 ? (retentionRate - prevRetentionRate) : 0,

            TotalProductsSold = productsSold
        };
    }

    private async Task<List<RevenueDataPointDto>> GetRevenueOverTimeAsync(
        DateTime startDate, DateTime endDate, string granularity)
    {
        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.OrderDate)
            .ToListAsync();

        //var grouped = granularity.ToLower() switch
        //{
        //    "weekly" => orders.GroupBy(o => new { Year = o.OrderDate.Year, Week = GetWeekOfYear(o.OrderDate) }),
        //    "monthly" => orders.GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month }),
        //    _ => orders.GroupBy(o => o.OrderDate.Date)
        //};

        return granularity.ToLower() switch
        {
            "weekly" => orders
                .GroupBy(o => new { o.OrderDate.Year, Week = GetWeekOfYear(o.OrderDate) })
                .Select(g =>
                {
                    var firstOrder = g.OrderBy(o => o.OrderDate).First();
                    return new RevenueDataPointDto
                    {
                        Period = $"Week {g.Key.Week}, {g.Key.Year}",
                        Date = firstOrder.OrderDate.Date,
                        GrossRevenue = g.Sum(o => o.TotalAmount),
                        NetRevenue = g.Where(o => o.PaymentStatus != "Refunded").Sum(o => o.TotalAmount),
                        ShippingRevenue = g.Sum(o => o.ShippingCost ?? 0),
                        OrderCount = g.Count()
                    };
                })
                .OrderBy(r => r.Date)
                .ToList(),

            "monthly" => orders
                .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                .Select(g =>
                {
                    var date = new DateTime(g.Key.Year, g.Key.Month, 1);
                    return new RevenueDataPointDto
                    {
                        Period = date.ToString("MMM yyyy"),
                        Date = date,
                        GrossRevenue = g.Sum(o => o.TotalAmount),
                        NetRevenue = g.Where(o => o.PaymentStatus != "Refunded").Sum(o => o.TotalAmount),
                        ShippingRevenue = g.Sum(o => o.ShippingCost ?? 0),
                        OrderCount = g.Count()
                    };
                })
                .OrderBy(r => r.Date)
                .ToList(),

            _ => orders
                .GroupBy(o => o.OrderDate.Date)
                .Select(g => new RevenueDataPointDto
                {
                    Period = g.Key.ToString("MMM dd"),
                    Date = g.Key,
                    GrossRevenue = g.Sum(o => o.TotalAmount),
                    NetRevenue = g.Where(o => o.PaymentStatus != "Refunded").Sum(o => o.TotalAmount),
                    ShippingRevenue = g.Sum(o => o.ShippingCost ?? 0),
                    OrderCount = g.Count()
                })
                .OrderBy(r => r.Date)
                .ToList()
        };
    }

    private async Task<List<OrderVolumeDataPointDto>> GetOrderVolumeOverTimeAsync(
        DateTime startDate, DateTime endDate, string granularity)
    {
        var orders = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
            .OrderBy(o => o.OrderDate)
            .ToListAsync();

        return granularity.ToLower() switch
        {
            "weekly" => orders
                .GroupBy(o => new { o.OrderDate.Year, Week = GetWeekOfYear(o.OrderDate) })
                .Select(g =>
                {
                    var firstOrder = g.OrderBy(o => o.OrderDate).First();
                    var nonCancelled = g.Where(o => o.Status != OrderStatus.Cancelled).ToList();
                    return new OrderVolumeDataPointDto
                    {
                        Period = $"Week {g.Key.Week}",
                        Date = firstOrder.OrderDate.Date,
                        TotalOrders = g.Count(),
                        PendingOrders = g.Count(o => o.Status == OrderStatus.Pending),
                        ProcessingOrders = g.Count(o => o.Status == OrderStatus.Processing),
                        ShippedOrders = g.Count(o => o.Status == OrderStatus.Shipped),
                        DeliveredOrders = g.Count(o => o.Status == OrderStatus.Delivered),
                        CancelledOrders = g.Count(o => o.Status == OrderStatus.Cancelled),
                        AverageOrderValue = nonCancelled.Count > 0 ? nonCancelled.Average(o => o.TotalAmount) : 0
                    };
                })
                .OrderBy(r => r.Date)
                .ToList(),

            "monthly" => orders
                .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                .Select(g =>
                {
                    var date = new DateTime(g.Key.Year, g.Key.Month, 1);
                    var nonCancelled = g.Where(o => o.Status != OrderStatus.Cancelled).ToList();
                    return new OrderVolumeDataPointDto
                    {
                        Period = date.ToString("MMM"),
                        Date = date,
                        TotalOrders = g.Count(),
                        PendingOrders = g.Count(o => o.Status == OrderStatus.Pending),
                        ProcessingOrders = g.Count(o => o.Status == OrderStatus.Processing),
                        ShippedOrders = g.Count(o => o.Status == OrderStatus.Shipped),
                        DeliveredOrders = g.Count(o => o.Status == OrderStatus.Delivered),
                        CancelledOrders = g.Count(o => o.Status == OrderStatus.Cancelled),
                        AverageOrderValue = nonCancelled.Count > 0 ? nonCancelled.Average(o => o.TotalAmount) : 0
                    };
                })
                .OrderBy(r => r.Date)
                .ToList(),

            _ => orders
                .GroupBy(o => o.OrderDate.Date)
                .Select(g =>
                {
                    var nonCancelled = g.Where(o => o.Status != OrderStatus.Cancelled).ToList();
                    return new OrderVolumeDataPointDto
                    {
                        Period = g.Key.ToString("MMM dd"),
                        Date = g.Key,
                        TotalOrders = g.Count(),
                        PendingOrders = g.Count(o => o.Status == OrderStatus.Pending),
                        ProcessingOrders = g.Count(o => o.Status == OrderStatus.Processing),
                        ShippedOrders = g.Count(o => o.Status == OrderStatus.Shipped),
                        DeliveredOrders = g.Count(o => o.Status == OrderStatus.Delivered),
                        CancelledOrders = g.Count(o => o.Status == OrderStatus.Cancelled),
                        AverageOrderValue = nonCancelled.Count > 0 ? nonCancelled.Average(o => o.TotalAmount) : 0
                    };
                })
                .OrderBy(r => r.Date)
                .ToList()
        };
    }

    private async Task<List<CategorySalesDto>> GetSalesByCategoryAsync(DateTime startDate, DateTime endDate)
    {
        // Load data into memory first to avoid complex EF Core translation issues
        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .ThenInclude(p => p.Category)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate < endDate)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var salesByCategory = orderItems
            .GroupBy(oi => new { oi.Product.CategoryId, CategoryName = oi.Product.Category?.Name ?? "Unknown" })
            .Select(g => new
            {
                CategoryId = g.Key.CategoryId,
                CategoryName = g.Key.CategoryName,
                Revenue = g.Sum(oi => oi.Subtotal),
                UnitsSold = g.Sum(oi => oi.Quantity),
                OrderCount = g.Select(oi => oi.OrderId).Distinct().Count()
            })
            .ToList();

        var totalRevenue = salesByCategory.Sum(c => c.Revenue);

        // Order first, then assign colors by index
        var orderedCategories = salesByCategory.OrderByDescending(c => c.Revenue).ToList();

        return orderedCategories
            .Select((c, index) => new CategorySalesDto
            {
                CategoryId = c.CategoryId,
                CategoryName = c.CategoryName,
                Revenue = c.Revenue,
                UnitsSold = c.UnitsSold,
                OrderCount = c.OrderCount,
                PercentageOfTotal = totalRevenue > 0 ? c.Revenue / totalRevenue * 100 : 0,
                Color = CategoryColors[index % CategoryColors.Length]
            })
            .ToList();
    }

    private async Task<List<TopProductDto>> GetTopProductsAsync(DateTime startDate, DateTime endDate, int limit)
    {
        // Load data into memory first to avoid complex EF Core translation issues
        var orderItems = await _context.OrderItems
            .Include(oi => oi.Product)
            .ThenInclude(p => p.Category)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate < endDate)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var productSales = orderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g =>
            {
                var firstItem = g.First();
                return new
                {
                    ProductId = g.Key,
                    ProductName = firstItem.Product?.Name ?? "Unknown",
                    ProductImageUrl = firstItem.Product?.ImageUrl,
                    CategoryName = firstItem.Product?.Category?.Name ?? "Unknown",
                    UnitsSold = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.Subtotal),
                    AveragePrice = g.Average(oi => oi.UnitPrice),
                    CurrentStock = firstItem.Product?.StockQuantity ?? 0
                };
            })
            .OrderByDescending(p => p.Revenue)
            .Take(limit)
            .ToList();

        var totalRevenue = productSales.Sum(p => p.Revenue);

        return productSales.Select(p => new TopProductDto
        {
            ProductId = p.ProductId,
            ProductName = p.ProductName,
            ProductImageUrl = p.ProductImageUrl,
            CategoryName = p.CategoryName,
            UnitsSold = p.UnitsSold,
            Revenue = p.Revenue,
            AveragePrice = p.AveragePrice,
            CurrentStock = p.CurrentStock,
            StockStatus = p.CurrentStock <= CriticalStockThreshold ? "critical"
                        : p.CurrentStock <= LowStockThreshold ? "low"
                        : "good",
            RevenuePercentOfTotal = totalRevenue > 0 ? p.Revenue / totalRevenue * 100 : 0
        }).ToList();
    }

    private async Task<InventoryInsightsDto> GetInventoryInsightsAsync(DateTime startDate, DateTime endDate)
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .ToListAsync();

        var periodDays = (endDate - startDate).Days;
        var weeks = Math.Max(1, periodDays / 7.0);

        // Get sales data for the period - load into memory first to avoid complex EF translations
        var orderItems = await _context.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate < endDate)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var salesData = orderItems
            .GroupBy(oi => oi.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.Subtotal),
                LastSaleDate = g.Max(oi => oi.Order.OrderDate)
            })
            .ToDictionary(x => x.ProductId);

        // Low stock alerts
        var lowStockProducts = products
            .Where(p => p.IsActive && p.StockQuantity <= LowStockThreshold)
            .Select(p =>
            {
                var sales = salesData.GetValueOrDefault(p.Id);
                var weeklySalesRate = sales != null ? (decimal)sales.UnitsSold / (decimal)weeks : 0;
                var daysUntilStockout = weeklySalesRate > 0
                    ? (int)(p.StockQuantity / (weeklySalesRate / 7))
                    : int.MaxValue;

                return new LowStockAlertDto
                {
                    ProductId = p.Id,
                    ProductName = p.Name,
                    CurrentStock = p.StockQuantity,
                    ReorderThreshold = LowStockThreshold,
                    Urgency = p.StockQuantity <= CriticalStockThreshold ? "critical"
                            : p.StockQuantity <= LowStockThreshold / 2 ? "low"
                            : "reorder",
                    WeeklySalesRate = weeklySalesRate,
                    DaysUntilStockout = daysUntilStockout == int.MaxValue ? 999 : daysUntilStockout
                };
            })
            .OrderBy(a => a.CurrentStock)
            .Take(10)
            .ToList();

        // Fast movers (>= 20 units/week)
        var fastMovers = products
            .Select(p =>
            {
                var sales = salesData.GetValueOrDefault(p.Id);
                var weeklySalesRate = sales != null ? (decimal)sales.UnitsSold / (decimal)weeks : 0;
                var daysSinceLastSale = sales != null
                    ? (int)(DateTime.UtcNow - sales.LastSaleDate).TotalDays
                    : int.MaxValue;

                return new
                {
                    Product = p,
                    Sales = sales,
                    WeeklySalesRate = weeklySalesRate,
                    DaysSinceLastSale = daysSinceLastSale
                };
            })
            .Where(x => x.WeeklySalesRate >= 20)
            .OrderByDescending(x => x.WeeklySalesRate)
            .Take(5)
            .Select(x => new ProductPerformanceDto
            {
                ProductId = x.Product.Id,
                ProductName = x.Product.Name,
                UnitsSold = x.Sales?.UnitsSold ?? 0,
                Revenue = x.Sales?.Revenue ?? 0,
                CurrentStock = x.Product.StockQuantity,
                WeeklySalesRate = x.WeeklySalesRate,
                DaysSinceLastSale = x.DaysSinceLastSale == int.MaxValue ? 999 : x.DaysSinceLastSale
            })
            .ToList();

        // Slow movers / dead stock (<= 2 sales in 90 days)
        var slowMovers = products
            .Where(p => p.IsActive)
            .Select(p =>
            {
                var sales = salesData.GetValueOrDefault(p.Id);
                var unitsSold = sales?.UnitsSold ?? 0;
                var daysSinceLastSale = sales != null
                    ? (int)(DateTime.UtcNow - sales.LastSaleDate).TotalDays
                    : int.MaxValue;

                return new
                {
                    Product = p,
                    Sales = sales,
                    UnitsSold = unitsSold,
                    DaysSinceLastSale = daysSinceLastSale
                };
            })
            .Where(x => x.UnitsSold <= 2 || x.DaysSinceLastSale > 30)
            .OrderBy(x => x.UnitsSold)
            .ThenByDescending(x => x.DaysSinceLastSale)
            .Take(5)
            .Select(x => new ProductPerformanceDto
            {
                ProductId = x.Product.Id,
                ProductName = x.Product.Name,
                UnitsSold = x.UnitsSold,
                Revenue = x.Sales?.Revenue ?? 0,
                CurrentStock = x.Product.StockQuantity,
                WeeklySalesRate = x.UnitsSold / (decimal)weeks,
                DaysSinceLastSale = x.DaysSinceLastSale == int.MaxValue ? 999 : x.DaysSinceLastSale
            })
            .ToList();

        return new InventoryInsightsDto
        {
            TotalProducts = products.Count,
            ActiveProducts = products.Count(p => p.IsActive),
            LowStockCount = products.Count(p => p.IsActive && p.StockQuantity <= LowStockThreshold && p.StockQuantity > 0),
            OutOfStockCount = products.Count(p => p.IsActive && p.StockQuantity == 0),
            LowStockAlerts = lowStockProducts,
            FastMovers = fastMovers,
            SlowMovers = slowMovers,
            FastMoverCount = products.Count(p =>
            {
                var sales = salesData.GetValueOrDefault(p.Id);
                return sales != null && (decimal)sales.UnitsSold / (decimal)weeks >= 20;
            }),
            SlowMoverCount = slowMovers.Count,
            DeadStockCount = products.Count(p =>
            {
                var sales = salesData.GetValueOrDefault(p.Id);
                return p.IsActive && (sales == null || sales.UnitsSold <= 2);
            })
        };
    }

    private async Task<CustomerAnalyticsDto> GetCustomerAnalyticsAsync(DateTime startDate, DateTime endDate)
    {
        // Get all orders in period
        var ordersInPeriod = await _context.Orders
            .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var customerIdsInPeriod = ordersInPeriod.Select(o => o.UserId).Distinct().ToList();

        // Get first order dates for all customers - load into memory first
        var allOrdersForCustomers = await _context.Orders
            .Where(o => customerIdsInPeriod.Contains(o.UserId))
            .ToListAsync();

        var customerFirstOrders = allOrdersForCustomers
            .GroupBy(o => o.UserId)
            .ToDictionary(g => g.Key, g => g.Min(o => o.OrderDate));

        var newCustomers = customerIdsInPeriod.Count(id =>
            customerFirstOrders.TryGetValue(id, out var firstOrder) && firstOrder >= startDate);
        var returningCustomers = customerIdsInPeriod.Count - newCustomers;

        // Customer lifetime values - load into memory first
        var allNonCancelledOrders = await _context.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .ToListAsync();

        var customerStats = allNonCancelledOrders
            .GroupBy(o => o.UserId)
            .Select(g =>
            {
                var firstOrder = g.OrderBy(o => o.OrderDate).First();
                return new
                {
                    UserId = g.Key,
                    CustomerName = firstOrder.CustomerName ?? "Unknown",
                    CustomerEmail = firstOrder.CustomerEmail ?? "Unknown",
                    TotalOrders = g.Count(),
                    LifetimeValue = g.Sum(o => o.TotalAmount),
                    AverageOrderValue = g.Average(o => o.TotalAmount),
                    FirstOrderDate = g.Min(o => o.OrderDate),
                    LastOrderDate = g.Max(o => o.OrderDate)
                };
            })
            .ToList();

        // Top customers by LTV
        var topCustomers = customerStats
            .OrderByDescending(c => c.LifetimeValue)
            .Take(10)
            .Select(c => new TopCustomerDto
            {
                UserId = c.UserId,
                CustomerName = c.CustomerName,
                CustomerEmail = c.CustomerEmail,
                TotalOrders = c.TotalOrders,
                LifetimeValue = c.LifetimeValue,
                AverageOrderValue = c.AverageOrderValue,
                FirstOrderDate = c.FirstOrderDate,
                LastOrderDate = c.LastOrderDate,
                Segment = c.LifetimeValue >= 10000 ? "VIP"
                        : c.TotalOrders >= 5 ? "Loyal"
                        : c.TotalOrders >= 2 ? "Regular"
                        : "New"
            })
            .ToList();

        // Customer segments
        var segments = new List<CustomerSegmentDto>
        {
            new()
            {
                SegmentName = "VIP",
                CustomerCount = customerStats.Count(c => c.LifetimeValue >= 10000),
                TotalRevenue = customerStats.Where(c => c.LifetimeValue >= 10000).Sum(c => c.LifetimeValue),
                AverageOrderValue = customerStats.Where(c => c.LifetimeValue >= 10000).Select(c => c.AverageOrderValue).DefaultIfEmpty(0).Average(),
                Description = "Lifetime value >= R10,000"
            },
            new()
            {
                SegmentName = "Loyal",
                CustomerCount = customerStats.Count(c => c.LifetimeValue < 10000 && c.TotalOrders >= 5),
                TotalRevenue = customerStats.Where(c => c.LifetimeValue < 10000 && c.TotalOrders >= 5).Sum(c => c.LifetimeValue),
                AverageOrderValue = customerStats.Where(c => c.LifetimeValue < 10000 && c.TotalOrders >= 5).Select(c => c.AverageOrderValue).DefaultIfEmpty(0).Average(),
                Description = "5+ orders"
            },
            new()
            {
                SegmentName = "Regular",
                CustomerCount = customerStats.Count(c => c.LifetimeValue < 10000 && c.TotalOrders >= 2 && c.TotalOrders < 5),
                TotalRevenue = customerStats.Where(c => c.LifetimeValue < 10000 && c.TotalOrders >= 2 && c.TotalOrders < 5).Sum(c => c.LifetimeValue),
                AverageOrderValue = customerStats.Where(c => c.LifetimeValue < 10000 && c.TotalOrders >= 2 && c.TotalOrders < 5).Select(c => c.AverageOrderValue).DefaultIfEmpty(0).Average(),
                Description = "2-4 orders"
            },
            new()
            {
                SegmentName = "New",
                CustomerCount = customerStats.Count(c => c.TotalOrders == 1),
                TotalRevenue = customerStats.Where(c => c.TotalOrders == 1).Sum(c => c.LifetimeValue),
                AverageOrderValue = customerStats.Where(c => c.TotalOrders == 1).Select(c => c.AverageOrderValue).DefaultIfEmpty(0).Average(),
                Description = "Single order"
            }
        };

        var totalCustomers = customerStats.Count;
        foreach (var segment in segments)
        {
            segment.PercentageOfTotal = totalCustomers > 0
                ? (decimal)segment.CustomerCount / totalCustomers * 100
                : 0;
        }

        return new CustomerAnalyticsDto
        {
            TotalCustomers = customerIdsInPeriod.Count,
            NewCustomers = newCustomers,
            ReturningCustomers = returningCustomers,
            NewCustomerPercent = customerIdsInPeriod.Count > 0 ? (decimal)newCustomers / customerIdsInPeriod.Count * 100 : 0,
            ReturningCustomerPercent = customerIdsInPeriod.Count > 0 ? (decimal)returningCustomers / customerIdsInPeriod.Count * 100 : 0,
            AverageCustomerLifetimeValue = customerStats.Count > 0 ? customerStats.Average(c => c.LifetimeValue) : 0,
            TopCustomers = topCustomers,
            CustomerSegments = segments
        };
    }

    private async Task<string> GenerateOrdersCsvAsync(DateTime startDate, DateTime endDate)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
            .Where(o => o.OrderDate >= startDate && o.OrderDate < endDate)
            .OrderByDescending(o => o.OrderDate)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Order Date,Order Number,Customer Name,Customer Email,Status,Item Count,Subtotal,Shipping Cost,Total Amount,Payment Status");

        foreach (var order in orders)
        {
            var subtotal = order.TotalAmount - (order.ShippingCost ?? 0);
            sb.AppendLine($"{order.OrderDate:yyyy-MM-dd HH:mm},{EscapeCsv(order.OrderNumber)},{EscapeCsv(order.CustomerName)},{EscapeCsv(order.CustomerEmail)},{order.Status},{order.OrderItems.Sum(oi => oi.Quantity)},{subtotal:F2},{order.ShippingCost ?? 0:F2},{order.TotalAmount:F2},{EscapeCsv(order.PaymentStatus)}");
        }

        return sb.ToString();
    }

    private async Task<string> GenerateRevenueCsvAsync(DateTime startDate, DateTime endDate)
    {
        var revenueData = await GetRevenueOverTimeAsync(startDate, endDate, "daily");

        var sb = new StringBuilder();
        sb.AppendLine("Date,Gross Revenue,Net Revenue,Shipping Revenue,Order Count");

        foreach (var point in revenueData)
        {
            sb.AppendLine($"{point.Date:yyyy-MM-dd},{point.GrossRevenue:F2},{point.NetRevenue:F2},{point.ShippingRevenue:F2},{point.OrderCount}");
        }

        return sb.ToString();
    }

    private async Task<string> GenerateProductsCsvAsync(DateTime startDate, DateTime endDate)
    {
        var productSales = await _context.OrderItems
            .Include(oi => oi.Product)
            .ThenInclude(p => p.Category)
            .Include(oi => oi.Order)
            .Where(oi => oi.Order.OrderDate >= startDate && oi.Order.OrderDate < endDate)
            .Where(oi => oi.Order.Status != OrderStatus.Cancelled)
            .GroupBy(oi => new
            {
                oi.ProductId,
                oi.Product.Name,
                CategoryName = oi.Product.Category.Name,
                oi.Product.StockQuantity,
                oi.Product.Price,
                oi.Product.IsActive,
                oi.Product.IsFeatured
            })
            .Select(g => new ProductExportDto
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.Name,
                CategoryName = g.Key.CategoryName,
                UnitsSold = g.Sum(oi => oi.Quantity),
                Revenue = g.Sum(oi => oi.Subtotal),
                CurrentStock = g.Key.StockQuantity,
                Price = g.Key.Price,
                IsActive = g.Key.IsActive,
                IsFeatured = g.Key.IsFeatured
            })
            .OrderByDescending(p => p.Revenue)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Product ID,Product Name,Category,Units Sold,Revenue,Current Stock,Price,Active,Featured");

        foreach (var product in productSales)
        {
            sb.AppendLine($"{product.ProductId},{EscapeCsv(product.ProductName)},{EscapeCsv(product.CategoryName)},{product.UnitsSold},{product.Revenue:F2},{product.CurrentStock},{product.Price:F2},{product.IsActive},{product.IsFeatured}");
        }

        return sb.ToString();
    }

    private async Task<string> GenerateCustomersCsvAsync(DateTime startDate, DateTime endDate)
    {
        var customerStats = await _context.Orders
            .Where(o => o.Status != OrderStatus.Cancelled)
            .GroupBy(o => new { o.UserId, o.CustomerName, o.CustomerEmail })
            .Select(g => new
            {
                UserId = g.Key.UserId,
                CustomerName = g.Key.CustomerName,
                CustomerEmail = g.Key.CustomerEmail,
                TotalOrders = g.Count(),
                LifetimeValue = g.Sum(o => o.TotalAmount),
                AverageOrderValue = g.Average(o => o.TotalAmount),
                FirstOrderDate = g.Min(o => o.OrderDate),
                LastOrderDate = g.Max(o => o.OrderDate)
            })
            .OrderByDescending(c => c.LifetimeValue)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Customer ID,Customer Name,Customer Email,Total Orders,Lifetime Value,Average Order Value,First Order Date,Last Order Date,Segment");

        foreach (var customer in customerStats)
        {
            var segment = customer.LifetimeValue >= 10000 ? "VIP"
                        : customer.TotalOrders >= 5 ? "Loyal"
                        : customer.TotalOrders >= 2 ? "Regular"
                        : "New";

            sb.AppendLine($"{customer.UserId},{EscapeCsv(customer.CustomerName)},{EscapeCsv(customer.CustomerEmail)},{customer.TotalOrders},{customer.LifetimeValue:F2},{customer.AverageOrderValue:F2},{customer.FirstOrderDate:yyyy-MM-dd},{customer.LastOrderDate:yyyy-MM-dd},{segment}");
        }

        return sb.ToString();
    }

    private static string EscapeCsv(string value)
    {
        if (string.IsNullOrEmpty(value)) return "";
        if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
        {
            return $"\"{value.Replace("\"", "\"\"")}\"";
        }
        return value;
    }

    private static int GetWeekOfYear(DateTime date)
    {
        var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
        return cal.GetWeekOfYear(date, System.Globalization.CalendarWeekRule.FirstFourDayWeek, DayOfWeek.Monday);
    }

    #endregion
}
