using System.Text.Json.Serialization;

namespace Jits.API.Models.DTOs;

#region Request DTOs

/// <summary>
/// Request to get shipping rates/quotes
/// </summary>
public class GetShippingRatesRequest
{
    /// <summary>
    /// Delivery address details
    /// </summary>
    public ShippingAddressDto DeliveryAddress { get; set; } = new();

    /// <summary>
    /// List of parcels with dimensions and weight
    /// </summary>
    public List<ParcelDto> Parcels { get; set; } = new();

    /// <summary>
    /// Declared value for insurance purposes (in ZAR)
    /// </summary>
    public decimal? DeclaredValue { get; set; }
}

/// <summary>
/// Parcel dimensions and weight for rate calculation
/// </summary>
public class ParcelDto
{
    /// <summary>
    /// Length in centimeters
    /// </summary>
    public decimal LengthCm { get; set; }

    /// <summary>
    /// Width in centimeters
    /// </summary>
    public decimal WidthCm { get; set; }

    /// <summary>
    /// Height in centimeters
    /// </summary>
    public decimal HeightCm { get; set; }

    /// <summary>
    /// Weight in kilograms
    /// </summary>
    public decimal WeightKg { get; set; }

    /// <summary>
    /// Description of parcel contents
    /// </summary>
    public string? Description { get; set; }
}

/// <summary>
/// Request to create a shipment with Ship Logic
/// </summary>
public class CreateShipmentRequest
{
    /// <summary>
    /// Order ID this shipment is for
    /// </summary>
    public int OrderId { get; set; }

    /// <summary>
    /// Selected service level code (e.g., ECO, ONX)
    /// </summary>
    public string ServiceLevelCode { get; set; } = "ECO";

    /// <summary>
    /// Parcels to ship
    /// </summary>
    public List<ParcelDto> Parcels { get; set; } = new();

    /// <summary>
    /// Special instructions for collection
    /// </summary>
    public string? CollectionInstructions { get; set; }

    /// <summary>
    /// Special instructions for delivery
    /// </summary>
    public string? DeliveryInstructions { get; set; }

    /// <summary>
    /// Declared value for insurance (in ZAR)
    /// </summary>
    public decimal? DeclaredValue { get; set; }

    /// <summary>
    /// If true, suppress SMS/email notifications from Ship Logic
    /// </summary>
    public bool MuteNotifications { get; set; } = false;
}

#endregion

#region Response DTOs

/// <summary>
/// Response containing available shipping rates
/// </summary>
public class ShippingRatesResponse
{
    /// <summary>
    /// Available shipping options/rates
    /// </summary>
    public List<ShippingRateDto> Rates { get; set; } = new();

    /// <summary>
    /// Whether free shipping applies (based on order value threshold)
    /// </summary>
    public bool FreeShippingAvailable { get; set; }

    /// <summary>
    /// Amount needed to qualify for free shipping (0 if already qualified or disabled)
    /// </summary>
    public decimal AmountToFreeShipping { get; set; }
}

/// <summary>
/// Individual shipping rate/option
/// </summary>
public class ShippingRateDto
{
    /// <summary>
    /// Service level ID from Ship Logic
    /// </summary>
    public int ServiceLevelId { get; set; }

    /// <summary>
    /// Service level code (e.g., ECO, ONX, SDX)
    /// </summary>
    public string ServiceLevelCode { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable service name (e.g., "Economy", "Overnight Express")
    /// </summary>
    public string ServiceLevelName { get; set; } = string.Empty;

    /// <summary>
    /// Shipping cost excluding VAT
    /// </summary>
    public decimal Rate { get; set; }

    /// <summary>
    /// VAT amount
    /// </summary>
    public decimal Vat { get; set; }

    /// <summary>
    /// Total shipping cost including VAT
    /// </summary>
    public decimal TotalRate => Rate + Vat;

    /// <summary>
    /// Estimated delivery date/time (from)
    /// </summary>
    public DateTime? EstimatedDeliveryFrom { get; set; }

    /// <summary>
    /// Estimated delivery date/time (to)
    /// </summary>
    public DateTime? EstimatedDeliveryTo { get; set; }

    /// <summary>
    /// Human-readable delivery estimate (e.g., "2-3 business days")
    /// </summary>
    public string DeliveryEstimate { get; set; } = string.Empty;

    /// <summary>
    /// Collection hub name
    /// </summary>
    public string? CollectionHub { get; set; }

    /// <summary>
    /// Delivery hub name
    /// </summary>
    public string? DeliveryHub { get; set; }
}

/// <summary>
/// Response after creating a shipment
/// </summary>
public class ShipmentResponse
{
    /// <summary>
    /// Ship Logic shipment ID
    /// </summary>
    public int ShipmentId { get; set; }

    /// <summary>
    /// Short tracking reference (e.g., "G9G")
    /// </summary>
    public string TrackingReference { get; set; } = string.Empty;

    /// <summary>
    /// Custom/full tracking reference (e.g., "SLXG9G")
    /// </summary>
    public string CustomTrackingReference { get; set; } = string.Empty;

    /// <summary>
    /// Current shipment status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Shipping rate charged
    /// </summary>
    public decimal Rate { get; set; }

    /// <summary>
    /// Service level used
    /// </summary>
    public string ServiceLevelCode { get; set; } = string.Empty;

    public string ServiceLevelName { get; set; } = string.Empty;

    /// <summary>
    /// Estimated collection date/time
    /// </summary>
    public DateTime? EstimatedCollection { get; set; }

    /// <summary>
    /// Estimated delivery window start
    /// </summary>
    public DateTime? EstimatedDeliveryFrom { get; set; }

    /// <summary>
    /// Estimated delivery window end
    /// </summary>
    public DateTime? EstimatedDeliveryTo { get; set; }

    /// <summary>
    /// URL to download the shipping label/waybill PDF
    /// </summary>
    public string? LabelUrl { get; set; }

    /// <summary>
    /// Parcel tracking references
    /// </summary>
    public List<string> ParcelTrackingReferences { get; set; } = new();

    /// <summary>
    /// Timestamp when shipment was created
    /// </summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Tracking information for a shipment
/// </summary>
public class TrackingResponse
{
    /// <summary>
    /// Tracking reference used to query
    /// </summary>
    public string TrackingReference { get; set; } = string.Empty;

    /// <summary>
    /// Current overall shipment status
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable status description
    /// </summary>
    public string StatusDescription { get; set; } = string.Empty;

    /// <summary>
    /// Collection hub
    /// </summary>
    public string? CollectionHub { get; set; }

    /// <summary>
    /// Delivery hub
    /// </summary>
    public string? DeliveryHub { get; set; }

    /// <summary>
    /// Date/time collected (if applicable)
    /// </summary>
    public DateTime? CollectedDate { get; set; }

    /// <summary>
    /// Date/time delivered (if applicable)
    /// </summary>
    public DateTime? DeliveredDate { get; set; }

    /// <summary>
    /// Estimated delivery window start
    /// </summary>
    public DateTime? EstimatedDeliveryFrom { get; set; }

    /// <summary>
    /// Estimated delivery window end
    /// </summary>
    public DateTime? EstimatedDeliveryTo { get; set; }

    /// <summary>
    /// Chronological list of tracking events
    /// </summary>
    public List<TrackingEventDto> Events { get; set; } = new();

    /// <summary>
    /// Proof of delivery information (if delivered)
    /// </summary>
    public ProofOfDeliveryDto? ProofOfDelivery { get; set; }
}

/// <summary>
/// Individual tracking event
/// </summary>
public class TrackingEventDto
{
    /// <summary>
    /// Event ID
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Status code for this event
    /// </summary>
    public string Status { get; set; } = string.Empty;

    /// <summary>
    /// Human-readable event message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Location where event occurred (hub name)
    /// </summary>
    public string? Location { get; set; }

    /// <summary>
    /// Date/time of event
    /// </summary>
    public DateTime EventDate { get; set; }

    /// <summary>
    /// Source of the event (e.g., "system", "driver")
    /// </summary>
    public string? Source { get; set; }
}

/// <summary>
/// Proof of delivery information
/// </summary>
public class ProofOfDeliveryDto
{
    /// <summary>
    /// POD method (e.g., "POD image captured", "PIN entered successfully")
    /// </summary>
    public string Method { get; set; } = string.Empty;

    /// <summary>
    /// Recipient name (if entered)
    /// </summary>
    public string? RecipientName { get; set; }

    /// <summary>
    /// Signed URLs to POD images (if captured)
    /// </summary>
    public List<string> ImageUrls { get; set; } = new();

    /// <summary>
    /// Signed URLs to POD PDFs (if any)
    /// </summary>
    public List<string> PdfUrls { get; set; } = new();

    /// <summary>
    /// URL to digital POD document
    /// </summary>
    public string? DigitalPodUrl { get; set; }

    /// <summary>
    /// Date/time of delivery
    /// </summary>
    public DateTime? DeliveredAt { get; set; }

    /// <summary>
    /// GPS coordinates of delivery (if available)
    /// </summary>
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}

#endregion

#region Ship Logic API Models (Internal)

/// <summary>
/// Ship Logic API address format
/// </summary>
public class ShipLogicAddressDto
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "residential";

    [JsonPropertyName("company")]
    public string Company { get; set; } = string.Empty;

    [JsonPropertyName("street_address")]
    public string StreetAddress { get; set; } = string.Empty;

    [JsonPropertyName("local_area")]
    public string LocalArea { get; set; } = string.Empty;

    [JsonPropertyName("city")]
    public string City { get; set; } = string.Empty;

    [JsonPropertyName("zone")]
    public string Zone { get; set; } = string.Empty;

    [JsonPropertyName("country")]
    public string Country { get; set; } = "ZA";

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("lat")]
    public double? Lat { get; set; }

    [JsonPropertyName("lng")]
    public double? Lng { get; set; }
}

/// <summary>
/// Ship Logic API contact format
/// </summary>
public class ShipLogicContactDto
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("mobile_number")]
    public string MobileNumber { get; set; } = string.Empty;

    [JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Ship Logic API parcel format
/// </summary>
public class ShipLogicParcelDto
{
    [JsonPropertyName("parcel_description")]
    public string ParcelDescription { get; set; } = string.Empty;

    [JsonPropertyName("submitted_length_cm")]
    public decimal SubmittedLengthCm { get; set; }

    [JsonPropertyName("submitted_width_cm")]
    public decimal SubmittedWidthCm { get; set; }

    [JsonPropertyName("submitted_height_cm")]
    public decimal SubmittedHeightCm { get; set; }

    [JsonPropertyName("submitted_weight_kg")]
    public decimal SubmittedWeightKg { get; set; }
}

/// <summary>
/// Ship Logic rates request
/// </summary>
public class ShipLogicRatesRequest
{
    [JsonPropertyName("collection_address")]
    public ShipLogicAddressDto CollectionAddress { get; set; } = new();

    [JsonPropertyName("delivery_address")]
    public ShipLogicAddressDto DeliveryAddress { get; set; } = new();

    [JsonPropertyName("parcels")]
    public List<ShipLogicParcelDto> Parcels { get; set; } = new();

    [JsonPropertyName("declared_value")]
    public decimal? DeclaredValue { get; set; }

    [JsonPropertyName("collection_min_date")]
    public string? CollectionMinDate { get; set; }

    [JsonPropertyName("delivery_min_date")]
    public string? DeliveryMinDate { get; set; }
}

/// <summary>
/// Ship Logic rates response
/// </summary>
public class ShipLogicRatesResponse
{
    [JsonPropertyName("rates")]
    public List<ShipLogicRateItem> Rates { get; set; } = new();
}

public class ShipLogicRateItem
{
    [JsonPropertyName("service_level")]
    public ShipLogicServiceLevel ServiceLevel { get; set; } = new();

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("rate_excluding_vat")]
    public decimal RateExcludingVat { get; set; }

    [JsonPropertyName("base_rate")]
    public ShipLogicBaseRate BaseRate { get; set; } = new();

    [JsonPropertyName("estimated_delivery_from")]
    public DateTime? EstimatedDeliveryFrom { get; set; }

    [JsonPropertyName("estimated_delivery_to")]
    public DateTime? EstimatedDeliveryTo { get; set; }

    [JsonPropertyName("collection_hub")]
    public string? CollectionHub { get; set; }

    [JsonPropertyName("delivery_hub")]
    public string? DeliveryHub { get; set; }
}

public class ShipLogicServiceLevel
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class ShipLogicBaseRate
{
    [JsonPropertyName("charge")]
    public decimal Charge { get; set; }

    [JsonPropertyName("vat")]
    public decimal Vat { get; set; }
}

/// <summary>
/// Ship Logic create shipment request
/// </summary>
public class ShipLogicCreateShipmentRequest
{
    [JsonPropertyName("collection_address")]
    public ShipLogicAddressDto CollectionAddress { get; set; } = new();

    [JsonPropertyName("collection_contact")]
    public ShipLogicContactDto CollectionContact { get; set; } = new();

    [JsonPropertyName("delivery_address")]
    public ShipLogicAddressDto DeliveryAddress { get; set; } = new();

    [JsonPropertyName("delivery_contact")]
    public ShipLogicContactDto DeliveryContact { get; set; } = new();

    [JsonPropertyName("parcels")]
    public List<ShipLogicParcelDto> Parcels { get; set; } = new();

    [JsonPropertyName("service_level_code")]
    public string ServiceLevelCode { get; set; } = string.Empty;

    [JsonPropertyName("declared_value")]
    public decimal? DeclaredValue { get; set; }

    [JsonPropertyName("special_instructions_collection")]
    public string? SpecialInstructionsCollection { get; set; }

    [JsonPropertyName("special_instructions_delivery")]
    public string? SpecialInstructionsDelivery { get; set; }

    [JsonPropertyName("customer_reference")]
    public string? CustomerReference { get; set; }

    [JsonPropertyName("mute_notifications")]
    public bool MuteNotifications { get; set; }

    [JsonPropertyName("collection_min_date")]
    public string? CollectionMinDate { get; set; }

    [JsonPropertyName("collection_after")]
    public string CollectionAfter { get; set; } = "08:00";

    [JsonPropertyName("collection_before")]
    public string CollectionBefore { get; set; } = "17:00";

    [JsonPropertyName("delivery_min_date")]
    public string? DeliveryMinDate { get; set; }

    [JsonPropertyName("delivery_after")]
    public string DeliveryAfter { get; set; } = "08:00";

    [JsonPropertyName("delivery_before")]
    public string DeliveryBefore { get; set; } = "17:00";
}

/// <summary>
/// Ship Logic shipment response
/// </summary>
public class ShipLogicShipmentResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("short_tracking_reference")]
    public string ShortTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("custom_tracking_reference")]
    public string CustomTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("rate")]
    public decimal Rate { get; set; }

    [JsonPropertyName("service_level_code")]
    public string ServiceLevelCode { get; set; } = string.Empty;

    [JsonPropertyName("service_level_name")]
    public string ServiceLevelName { get; set; } = string.Empty;

    [JsonPropertyName("estimated_collection")]
    public DateTime? EstimatedCollection { get; set; }

    [JsonPropertyName("estimated_delivery_from")]
    public DateTime? EstimatedDeliveryFrom { get; set; }

    [JsonPropertyName("estimated_delivery_to")]
    public DateTime? EstimatedDeliveryTo { get; set; }

    [JsonPropertyName("time_created")]
    public DateTime TimeCreated { get; set; }

    [JsonPropertyName("parcels")]
    public List<ShipLogicParcelResponse> Parcels { get; set; } = new();

    [JsonPropertyName("collected_date")]
    public DateTime? CollectedDate { get; set; }

    [JsonPropertyName("delivered_date")]
    public DateTime? DeliveredDate { get; set; }

    [JsonPropertyName("collection_branch_name")]
    public string? CollectionBranchName { get; set; }

    [JsonPropertyName("delivery_branch_name")]
    public string? DeliveryBranchName { get; set; }
}

public class ShipLogicParcelResponse
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("tracking_reference")]
    public string TrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Ship Logic tracking response
/// </summary>
public class ShipLogicTrackingResponse
{
    [JsonPropertyName("short_tracking_reference")]
    public string ShortTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("custom_tracking_reference")]
    public string CustomTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("collection_hub")]
    public string? CollectionHub { get; set; }

    [JsonPropertyName("delivery_hub")]
    public string? DeliveryHub { get; set; }

    [JsonPropertyName("collected_date")]
    public DateTime? CollectedDate { get; set; }

    [JsonPropertyName("delivered_date")]
    public DateTime? DeliveredDate { get; set; }

    [JsonPropertyName("estimated_delivery_from")]
    public DateTime? EstimatedDeliveryFrom { get; set; }

    [JsonPropertyName("estimated_delivery_to")]
    public DateTime? EstimatedDeliveryTo { get; set; }

    [JsonPropertyName("tracking_events")]
    public List<ShipLogicTrackingEvent> TrackingEvents { get; set; } = new();
}

public class ShipLogicTrackingEvent
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("location")]
    public string? Location { get; set; }

    [JsonPropertyName("date")]
    public DateTime Date { get; set; }

    [JsonPropertyName("source")]
    public string? Source { get; set; }

    [JsonPropertyName("data")]
    public ShipLogicTrackingEventData? Data { get; set; }
}

public class ShipLogicTrackingEventData
{
    [JsonPropertyName("type")]
    public string? Type { get; set; }

    [JsonPropertyName("images")]
    public List<string>? Images { get; set; }

    [JsonPropertyName("pdfs")]
    public List<string>? Pdfs { get; set; }
}

/// <summary>
/// Ship Logic label response
/// </summary>
public class ShipLogicLabelResponse
{
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;
}

/// <summary>
/// Ship Logic webhook payload for tracking events
/// </summary>
public class ShipLogicWebhookPayload
{
    [JsonPropertyName("shipment_id")]
    public int ShipmentId { get; set; }

    [JsonPropertyName("short_tracking_reference")]
    public string ShortTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("custom_tracking_reference")]
    public string CustomTrackingReference { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("event_time")]
    public DateTime EventTime { get; set; }

    [JsonPropertyName("shipment_collected_date")]
    public DateTime? CollectedDate { get; set; }

    [JsonPropertyName("shipment_delivered_date")]
    public DateTime? DeliveredDate { get; set; }

    [JsonPropertyName("shipment_estimated_delivery_from")]
    public DateTime? EstimatedDeliveryFrom { get; set; }

    [JsonPropertyName("shipment_estimated_delivery_to")]
    public DateTime? EstimatedDeliveryTo { get; set; }

    [JsonPropertyName("tracking_events")]
    public List<ShipLogicTrackingEvent>? TrackingEvents { get; set; }

    [JsonPropertyName("update_type")]
    public string? UpdateType { get; set; }
}

#endregion
