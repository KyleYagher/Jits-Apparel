using Jits_Apparel.Server.Models.Enums;

namespace Jits.API.Models.Entities;

public class Order
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime OrderDate { get; set; }
    public OrderStatus Status { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Shipping information
    public ShippingMethod? ShippingMethod { get; set; }
    public string? TrackingNumber { get; set; }
    public string? EstimatedDelivery { get; set; }
    public string? ShippingFullName { get; set; }
    public string? ShippingAddressLine1 { get; set; }
    public string? ShippingAddressLine2 { get; set; }
    public string? ShippingCity { get; set; }
    public string? ShippingProvince { get; set; }
    public string? ShippingPostalCode { get; set; }
    public string? ShippingCountry { get; set; }

    // Payment information
    public string? PaymentMethod { get; set; }
    public string PaymentStatus { get; set; } = "Pending";

    // Customer snapshot (captured at order creation)
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
