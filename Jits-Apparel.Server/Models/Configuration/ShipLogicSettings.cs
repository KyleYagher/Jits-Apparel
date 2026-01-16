namespace Jits.API.Models.Configuration;

/// <summary>
/// Configuration settings for Ship Logic API integration (The Courier Guy)
/// </summary>
public class ShipLogicSettings
{
    /// <summary>
    /// Ship Logic API base URL
    /// Production: https://api.shiplogic.com
    /// Sandbox: https://api.shiplogic.com (same URL, different API key)
    /// </summary>
    public string BaseUrl { get; set; } = "https://api.shiplogic.com";

    /// <summary>
    /// Bearer token for API authentication
    /// Get from Ship Logic dashboard: Settings > API Keys
    /// Sandbox token for testing: a601d99c75fc4c64b5a64288f97d52b4
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    /// <summary>
    /// Whether to use sandbox mode for testing
    /// </summary>
    public bool UseSandbox { get; set; } = true;

    /// <summary>
    /// Default collection address (your warehouse/store)
    /// </summary>
    public ShipLogicAddress DefaultCollectionAddress { get; set; } = new();

    /// <summary>
    /// Default collection contact details
    /// </summary>
    public ShipLogicContact DefaultCollectionContact { get; set; } = new();

    /// <summary>
    /// Webhook secret for validating incoming webhook requests (optional)
    /// </summary>
    public string? WebhookSecret { get; set; }

    /// <summary>
    /// Default service level code (ECO = Economy, ONX = Overnight Express, etc.)
    /// </summary>
    public string DefaultServiceLevelCode { get; set; } = "ECO";

    /// <summary>
    /// Markup percentage to add to shipping rates (0 = no markup)
    /// </summary>
    public decimal ShippingMarkupPercent { get; set; } = 0;

    /// <summary>
    /// Free shipping threshold - orders above this amount get free shipping (0 = disabled)
    /// </summary>
    public decimal FreeShippingThreshold { get; set; } = 0;
}

/// <summary>
/// Ship Logic address structure
/// </summary>
public class ShipLogicAddress
{
    public string Type { get; set; } = "business"; // business, residential, counter, locker
    public string Company { get; set; } = string.Empty;
    public string StreetAddress { get; set; } = string.Empty;
    public string LocalArea { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Zone { get; set; } = string.Empty; // Province/State
    public string Country { get; set; } = "ZA";
    public string Code { get; set; } = string.Empty; // Postal code
    public double? Lat { get; set; }
    public double? Lng { get; set; }
}

/// <summary>
/// Ship Logic contact structure
/// </summary>
public class ShipLogicContact
{
    public string Name { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
