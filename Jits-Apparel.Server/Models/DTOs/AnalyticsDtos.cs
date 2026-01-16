namespace Jits.API.Models.DTOs;

// Main analytics dashboard response
public class AnalyticsDashboardDto
{
    public AnalyticsSummaryDto Summary { get; set; } = new();
    public List<RevenueDataPointDto> RevenueOverTime { get; set; } = new();
    public List<OrderVolumeDataPointDto> OrderVolumeOverTime { get; set; } = new();
    public List<CategorySalesDto> SalesByCategory { get; set; } = new();
    public List<TopProductDto> TopProducts { get; set; } = new();
    public InventoryInsightsDto InventoryInsights { get; set; } = new();
    public CustomerAnalyticsDto CustomerAnalytics { get; set; } = new();
}

// Summary metrics
public class AnalyticsSummaryDto
{
    public decimal TotalRevenue { get; set; }
    public decimal PreviousPeriodRevenue { get; set; }
    public decimal RevenueChangePercent { get; set; }

    public int TotalOrders { get; set; }
    public int PreviousPeriodOrders { get; set; }
    public decimal OrdersChangePercent { get; set; }

    public decimal AverageOrderValue { get; set; }
    public decimal PreviousAverageOrderValue { get; set; }
    public decimal AovChangePercent { get; set; }

    public int TotalCustomers { get; set; }
    public int NewCustomers { get; set; }
    public int ReturningCustomers { get; set; }
    public decimal CustomerRetentionRate { get; set; }
    public decimal PreviousRetentionRate { get; set; }
    public decimal RetentionChangePercent { get; set; }

    public int TotalProductsSold { get; set; }
}

// Revenue data point for charts
public class RevenueDataPointDto
{
    public string Period { get; set; } = string.Empty;  // "Jan", "Feb", "2024-01-15", etc.
    public DateTime Date { get; set; }
    public decimal GrossRevenue { get; set; }
    public decimal NetRevenue { get; set; }  // After refunds
    public decimal ShippingRevenue { get; set; }
    public int OrderCount { get; set; }
}

// Order volume data point
public class OrderVolumeDataPointDto
{
    public string Period { get; set; } = string.Empty;
    public DateTime Date { get; set; }
    public int TotalOrders { get; set; }
    public int PendingOrders { get; set; }
    public int ProcessingOrders { get; set; }
    public int ShippedOrders { get; set; }
    public int DeliveredOrders { get; set; }
    public int CancelledOrders { get; set; }
    public decimal AverageOrderValue { get; set; }
}

// Sales by category
public class CategorySalesDto
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int UnitsSold { get; set; }
    public int OrderCount { get; set; }
    public decimal PercentageOfTotal { get; set; }
    public string Color { get; set; } = "#ec4899";  // For chart coloring
}

// Top selling products
public class TopProductDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ProductImageUrl { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public decimal AveragePrice { get; set; }
    public int CurrentStock { get; set; }
    public string StockStatus { get; set; } = "good";  // "critical", "low", "good"
    public decimal RevenuePercentOfTotal { get; set; }
}

// Inventory insights
public class InventoryInsightsDto
{
    public int TotalProducts { get; set; }
    public int ActiveProducts { get; set; }
    public int LowStockCount { get; set; }
    public int OutOfStockCount { get; set; }
    public List<LowStockAlertDto> LowStockAlerts { get; set; } = new();
    public List<ProductPerformanceDto> FastMovers { get; set; } = new();
    public List<ProductPerformanceDto> SlowMovers { get; set; } = new();
    public int FastMoverCount { get; set; }
    public int SlowMoverCount { get; set; }
    public int DeadStockCount { get; set; }
}

// Low stock alert
public class LowStockAlertDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? Size { get; set; }
    public int CurrentStock { get; set; }
    public int ReorderThreshold { get; set; }
    public string Urgency { get; set; } = "low";  // "critical", "low", "reorder"
    public decimal WeeklySalesRate { get; set; }  // Average units sold per week
    public int DaysUntilStockout { get; set; }
}

// Product performance (fast/slow movers)
public class ProductPerformanceDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public int CurrentStock { get; set; }
    public decimal WeeklySalesRate { get; set; }
    public int DaysSinceLastSale { get; set; }
}

// Customer analytics
public class CustomerAnalyticsDto
{
    public int TotalCustomers { get; set; }
    public int NewCustomers { get; set; }
    public int ReturningCustomers { get; set; }
    public decimal NewCustomerPercent { get; set; }
    public decimal ReturningCustomerPercent { get; set; }
    public decimal AverageCustomerLifetimeValue { get; set; }
    public List<TopCustomerDto> TopCustomers { get; set; } = new();
    public List<CustomerSegmentDto> CustomerSegments { get; set; } = new();
}

// Top customer by LTV
public class TopCustomerDto
{
    public int UserId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public int TotalOrders { get; set; }
    public decimal LifetimeValue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public DateTime FirstOrderDate { get; set; }
    public DateTime LastOrderDate { get; set; }
    public string Segment { get; set; } = "Regular";  // "VIP", "Loyal", "Regular", "At Risk"
}

// Customer segment breakdown
public class CustomerSegmentDto
{
    public string SegmentName { get; set; } = string.Empty;  // "VIP", "Loyal", "Regular", "New", "At Risk"
    public int CustomerCount { get; set; }
    public decimal PercentageOfTotal { get; set; }
    public decimal TotalRevenue { get; set; }
    public decimal AverageOrderValue { get; set; }
    public string Description { get; set; } = string.Empty;
}

// Request for analytics with date range
public class AnalyticsRequest
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Granularity { get; set; } = "daily";  // "daily", "weekly", "monthly"
    public bool IncludeComparison { get; set; } = true;  // Compare to previous period
}

// Export request
public class AnalyticsExportRequest
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string ExportType { get; set; } = "summary";  // "summary", "revenue", "orders", "products", "customers"
    public string Format { get; set; } = "csv";  // "csv", "json"
}

// Revenue export data
public class RevenueExportDto
{
    public DateTime Date { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal ShippingCost { get; set; }
    public decimal TotalAmount { get; set; }
    public string PaymentStatus { get; set; } = string.Empty;
}

// Product performance export
public class ProductExportDto
{
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public int UnitsSold { get; set; }
    public decimal Revenue { get; set; }
    public int CurrentStock { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public bool IsFeatured { get; set; }
}
