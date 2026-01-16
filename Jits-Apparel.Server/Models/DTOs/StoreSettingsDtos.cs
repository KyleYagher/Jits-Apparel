namespace Jits.API.Models.DTOs;

// Response DTO for store settings
public class StoreSettingsDto
{
    // VAT Settings
    public decimal VatRate { get; set; }
    public bool VatEnabled { get; set; }
    public string VatNumber { get; set; } = string.Empty;

    // Store Information
    public string StoreName { get; set; } = string.Empty;
    public string StoreEmail { get; set; } = string.Empty;
    public string StorePhone { get; set; } = string.Empty;
    public string StoreAddressLine1 { get; set; } = string.Empty;
    public string StoreAddressLine2 { get; set; } = string.Empty;
    public string StoreCity { get; set; } = string.Empty;
    public string StoreProvince { get; set; } = string.Empty;
    public string StorePostalCode { get; set; } = string.Empty;
    public string StoreCountry { get; set; } = string.Empty;

    // Shipping
    public decimal FreeShippingThreshold { get; set; }

    // Timestamps
    public DateTime? UpdatedAt { get; set; }
}

// Request DTO for updating store settings
public class UpdateStoreSettingsRequest
{
    // VAT Settings
    public decimal? VatRate { get; set; }
    public bool? VatEnabled { get; set; }
    public string? VatNumber { get; set; }

    // Store Information
    public string? StoreName { get; set; }
    public string? StoreEmail { get; set; }
    public string? StorePhone { get; set; }
    public string? StoreAddressLine1 { get; set; }
    public string? StoreAddressLine2 { get; set; }
    public string? StoreCity { get; set; }
    public string? StoreProvince { get; set; }
    public string? StorePostalCode { get; set; }
    public string? StoreCountry { get; set; }

    // Shipping
    public decimal? FreeShippingThreshold { get; set; }
}

// Simplified DTO for public access (checkout page needs VAT rate)
public class PublicStoreSettingsDto
{
    public decimal VatRate { get; set; }
    public bool VatEnabled { get; set; }
    public decimal FreeShippingThreshold { get; set; }
    public string StoreName { get; set; } = string.Empty;
}
