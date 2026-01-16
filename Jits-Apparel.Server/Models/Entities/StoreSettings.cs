namespace Jits.API.Models.Entities;

public class StoreSettings
{
    public int Id { get; set; }

    // VAT Settings
    public decimal VatRate { get; set; } = 15.0m; // Default 15% for South Africa
    public bool VatEnabled { get; set; } = true;
    public string VatNumber { get; set; } = string.Empty;

    // Store Information (for invoices)
    public string StoreName { get; set; } = "Jits Apparel";
    public string StoreEmail { get; set; } = string.Empty;
    public string StorePhone { get; set; } = string.Empty;
    public string StoreAddressLine1 { get; set; } = string.Empty;
    public string StoreAddressLine2 { get; set; } = string.Empty;
    public string StoreCity { get; set; } = string.Empty;
    public string StoreProvince { get; set; } = string.Empty;
    public string StorePostalCode { get; set; } = string.Empty;
    public string StoreCountry { get; set; } = "South Africa";

    // Free Shipping Threshold
    public decimal FreeShippingThreshold { get; set; } = 500.0m;

    // Timestamps
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
