using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Jits.API.Data;
using Jits.API.Models.Configuration;
using Jits.API.Models.DTOs;
using Jits.API.Models.Entities;
using Jits_Apparel.Server.Models.Enums;

namespace Jits.API.Services;

/// <summary>
/// Ship Logic (The Courier Guy) shipping service implementation
/// </summary>
public class ShipLogicService : IShippingService
{
    private readonly HttpClient _httpClient;
    private readonly ShipLogicSettings _settings;
    private readonly JitsDbContext _dbContext;
    private readonly ILogger<ShipLogicService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        PropertyNameCaseInsensitive = true
    };

    // Status descriptions for user-friendly display
    private static readonly Dictionary<string, string> StatusDescriptions = new()
    {
        ["submitted"] = "Shipment submitted",
        ["collection-assigned"] = "Driver assigned for collection",
        ["collection-unassigned"] = "Awaiting driver assignment",
        ["collection-exception"] = "Collection issue - please contact support",
        ["collection-failed-attempt"] = "Collection attempted but unsuccessful",
        ["collected"] = "Parcel collected",
        ["awaiting-dropoff"] = "Awaiting drop-off",
        ["at-hub"] = "At sorting hub",
        ["on-hold"] = "On hold - pending resolution",
        ["returned-to-hub"] = "Returned to hub",
        ["manifested"] = "Added to transfer manifest",
        ["ready-for-dispatch"] = "Ready for dispatch",
        ["in-transit"] = "In transit",
        ["at-destination-hub"] = "Arrived at destination hub",
        ["delivery-assigned"] = "Out for delivery",
        ["delivery-unassigned"] = "Awaiting delivery assignment",
        ["out-for-delivery"] = "Out for delivery",
        ["delivery-exception"] = "Delivery issue - please contact support",
        ["delivery-failed-attempt"] = "Delivery attempted but unsuccessful",
        ["ready-for-pickup"] = "Ready for pickup",
        ["delivered"] = "Delivered",
        ["returned-to-sender"] = "Returned to sender",
        ["undeliverable"] = "Unable to deliver",
        ["cancelled"] = "Cancelled"
    };

    public ShipLogicService(
        HttpClient httpClient,
        IOptions<ShipLogicSettings> settings,
        JitsDbContext dbContext,
        ILogger<ShipLogicService> logger)
    {
        _httpClient = httpClient;
        _settings = settings.Value;
        _dbContext = dbContext;
        _logger = logger;

        // Configure HTTP client
        _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _settings.ApiKey);
        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<ShippingRatesResponse> GetRatesAsync(GetShippingRatesRequest request, decimal orderSubtotal = 0)
    {
        try
        {
            // Build Ship Logic rates request
            var shipLogicRequest = new ShipLogicRatesRequest
            {
                CollectionAddress = MapToShipLogicAddress(_settings.DefaultCollectionAddress),
                DeliveryAddress = MapShippingAddressToShipLogic(request.DeliveryAddress),
                Parcels = request.Parcels.Select(p => new ShipLogicParcelDto
                {
                    ParcelDescription = p.Description ?? "Apparel",
                    SubmittedLengthCm = p.LengthCm,
                    SubmittedWidthCm = p.WidthCm,
                    SubmittedHeightCm = p.HeightCm,
                    SubmittedWeightKg = p.WeightKg
                }).ToList(),
                DeclaredValue = request.DeclaredValue,
                CollectionMinDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                DeliveryMinDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd")
            };

            var json = JsonSerializer.Serialize(shipLogicRequest, JsonOptions);
            _logger.LogInformation("Requesting rates from Ship Logic: {Request}", json);

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/rates", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ship Logic rates response: {Response}", responseContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Ship Logic rates request failed: {StatusCode} - {Response}",
                    response.StatusCode, responseContent);
                throw new Exception($"Failed to get shipping rates: {responseContent}");
            }

            var ratesResponse = JsonSerializer.Deserialize<ShipLogicRatesResponse>(responseContent, JsonOptions);

            // Calculate free shipping eligibility
            var freeShippingAvailable = _settings.FreeShippingThreshold > 0 &&
                                        orderSubtotal >= _settings.FreeShippingThreshold;
            var amountToFreeShipping = _settings.FreeShippingThreshold > 0
                ? Math.Max(0, _settings.FreeShippingThreshold - orderSubtotal)
                : 0;

            // Map to our response format
            var result = new ShippingRatesResponse
            {
                FreeShippingAvailable = freeShippingAvailable,
                AmountToFreeShipping = amountToFreeShipping,
                Rates = ratesResponse?.Rates?.Select(r => new ShippingRateDto
                {
                    ServiceLevelId = r.ServiceLevel.Id,
                    ServiceLevelCode = r.ServiceLevel.Code,
                    ServiceLevelName = r.ServiceLevel.Name,
                    Rate = ApplyMarkup(r.BaseRate.Charge),
                    Vat = ApplyMarkup(r.BaseRate.Vat),
                    EstimatedDeliveryFrom = r.EstimatedDeliveryFrom,
                    EstimatedDeliveryTo = r.EstimatedDeliveryTo,
                    DeliveryEstimate = CalculateDeliveryEstimate(r.EstimatedDeliveryFrom, r.EstimatedDeliveryTo),
                    CollectionHub = r.CollectionHub,
                    DeliveryHub = r.DeliveryHub
                }).ToList() ?? new List<ShippingRateDto>()
            };

            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting shipping rates");
            throw;
        }
    }

    public async Task<ShipmentResponse> CreateShipmentAsync(CreateShipmentRequest request)
    {
        try
        {
            // Get the order details
            var order = await _dbContext.Orders
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                .Include(o => o.User)
                .FirstOrDefaultAsync(o => o.Id == request.OrderId);

            if (order == null)
            {
                throw new Exception($"Order {request.OrderId} not found");
            }

            // Build Ship Logic shipment request
            var shipLogicRequest = new ShipLogicCreateShipmentRequest
            {
                CollectionAddress = MapToShipLogicAddress(_settings.DefaultCollectionAddress),
                CollectionContact = new ShipLogicContactDto
                {
                    Name = _settings.DefaultCollectionContact.Name,
                    MobileNumber = _settings.DefaultCollectionContact.MobileNumber,
                    Email = _settings.DefaultCollectionContact.Email
                },
                DeliveryAddress = new ShipLogicAddressDto
                {
                    Type = "residential",
                    Company = "",
                    StreetAddress = order.ShippingAddressLine1 ?? "",
                    LocalArea = order.ShippingAddressLine2 ?? "",
                    City = order.ShippingCity ?? "",
                    Zone = MapProvinceToZone(order.ShippingProvince),
                    Country = "ZA",
                    Code = order.ShippingPostalCode ?? ""
                },
                DeliveryContact = new ShipLogicContactDto
                {
                    Name = order.ShippingFullName ?? order.CustomerName,
                    MobileNumber = order.CustomerPhone ?? "",
                    Email = order.CustomerEmail
                },
                Parcels = request.Parcels.Select(p => new ShipLogicParcelDto
                {
                    ParcelDescription = p.Description ?? "Apparel",
                    SubmittedLengthCm = p.LengthCm,
                    SubmittedWidthCm = p.WidthCm,
                    SubmittedHeightCm = p.HeightCm,
                    SubmittedWeightKg = p.WeightKg
                }).ToList(),
                ServiceLevelCode = request.ServiceLevelCode,
                DeclaredValue = request.DeclaredValue ?? order.TotalAmount,
                SpecialInstructionsCollection = request.CollectionInstructions,
                SpecialInstructionsDelivery = request.DeliveryInstructions,
                CustomerReference = order.OrderNumber,
                MuteNotifications = request.MuteNotifications,
                CollectionMinDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                CollectionAfter = "08:00",
                CollectionBefore = "17:00",
                DeliveryMinDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                DeliveryAfter = "08:00",
                DeliveryBefore = "17:00"
            };

            var json = JsonSerializer.Serialize(shipLogicRequest, JsonOptions);
            _logger.LogInformation("Creating shipment with Ship Logic: {Request}", json);

            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/shipments", content);

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ship Logic create shipment response: {Response}", responseContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Ship Logic create shipment failed: {StatusCode} - {Response}",
                    response.StatusCode, responseContent);
                throw new Exception($"Failed to create shipment: {responseContent}");
            }

            var shipmentResponse = JsonSerializer.Deserialize<ShipLogicShipmentResponse>(responseContent, JsonOptions);

            if (shipmentResponse == null)
            {
                throw new Exception("Failed to parse shipment response");
            }

            // Update the order with shipping details
            order.TrackingNumber = shipmentResponse.CustomTrackingReference;
            order.ShippingCost = shipmentResponse.Rate;
            order.CarrierName = "The Courier Guy";
            order.ShipLogicShipmentId = shipmentResponse.Id;
            order.EstimatedDelivery = shipmentResponse.EstimatedDeliveryTo?.ToString("yyyy-MM-dd");
            order.Status = OrderStatus.Processing;
            order.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();

            // Get the label URL
            string? labelUrl = null;
            try
            {
                labelUrl = await GetLabelUrlAsync(shipmentResponse.Id);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to get label URL for shipment {ShipmentId}", shipmentResponse.Id);
            }

            return new ShipmentResponse
            {
                ShipmentId = shipmentResponse.Id,
                TrackingReference = shipmentResponse.ShortTrackingReference,
                CustomTrackingReference = shipmentResponse.CustomTrackingReference,
                Status = shipmentResponse.Status,
                Rate = shipmentResponse.Rate,
                ServiceLevelCode = shipmentResponse.ServiceLevelCode,
                ServiceLevelName = shipmentResponse.ServiceLevelName,
                EstimatedCollection = shipmentResponse.EstimatedCollection,
                EstimatedDeliveryFrom = shipmentResponse.EstimatedDeliveryFrom,
                EstimatedDeliveryTo = shipmentResponse.EstimatedDeliveryTo,
                LabelUrl = labelUrl,
                ParcelTrackingReferences = shipmentResponse.Parcels
                    .Select(p => p.TrackingReference).ToList(),
                CreatedAt = shipmentResponse.TimeCreated
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating shipment for order {OrderId}", request.OrderId);
            throw;
        }
    }

    public async Task<TrackingResponse> GetTrackingAsync(string trackingReference)
    {
        try
        {
            var response = await _httpClient.GetAsync(
                $"/tracking/shipments?tracking_reference={Uri.EscapeDataString(trackingReference)}");

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Ship Logic tracking response: {Response}", responseContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Ship Logic tracking request failed: {StatusCode} - {Response}",
                    response.StatusCode, responseContent);
                throw new Exception($"Failed to get tracking: {responseContent}");
            }

            var trackingResponse = JsonSerializer.Deserialize<ShipLogicTrackingResponse>(responseContent, JsonOptions);

            if (trackingResponse == null)
            {
                throw new Exception("Failed to parse tracking response");
            }

            return new TrackingResponse
            {
                TrackingReference = trackingResponse.CustomTrackingReference ?? trackingResponse.ShortTrackingReference,
                Status = trackingResponse.Status,
                StatusDescription = GetStatusDescription(trackingResponse.Status),
                CollectionHub = trackingResponse.CollectionHub,
                DeliveryHub = trackingResponse.DeliveryHub,
                CollectedDate = trackingResponse.CollectedDate,
                DeliveredDate = trackingResponse.DeliveredDate,
                EstimatedDeliveryFrom = trackingResponse.EstimatedDeliveryFrom,
                EstimatedDeliveryTo = trackingResponse.EstimatedDeliveryTo,
                Events = trackingResponse.TrackingEvents
                    .OrderByDescending(e => e.Date)
                    .Select(e => new TrackingEventDto
                    {
                        Id = e.Id,
                        Status = e.Status,
                        Message = !string.IsNullOrEmpty(e.Message) ? e.Message : GetStatusDescription(e.Status),
                        Location = e.Location,
                        EventDate = e.Date,
                        Source = e.Source
                    }).ToList(),
                ProofOfDelivery = ExtractProofOfDelivery(trackingResponse)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tracking for {TrackingReference}", trackingReference);
            throw;
        }
    }

    public async Task<string> GetLabelUrlAsync(int shipmentId)
    {
        try
        {
            var response = await _httpClient.GetAsync($"/shipments/label?id={shipmentId}");

            var responseContent = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Ship Logic get label failed: {StatusCode} - {Response}",
                    response.StatusCode, responseContent);
                throw new Exception($"Failed to get label: {responseContent}");
            }

            var labelResponse = JsonSerializer.Deserialize<ShipLogicLabelResponse>(responseContent, JsonOptions);
            return labelResponse?.Url ?? throw new Exception("Label URL not found in response");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting label for shipment {ShipmentId}", shipmentId);
            throw;
        }
    }

    public async Task<bool> CancelShipmentAsync(string trackingReference)
    {
        try
        {
            var request = new { tracking_reference = trackingReference };
            var json = JsonSerializer.Serialize(request, JsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync("/shipments/cancel", content);

            if (!response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Ship Logic cancel shipment failed: {StatusCode} - {Response}",
                    response.StatusCode, responseContent);
                return false;
            }

            // Update the order status
            var order = await _dbContext.Orders
                .FirstOrDefaultAsync(o => o.TrackingNumber == trackingReference);

            if (order != null)
            {
                order.Status = OrderStatus.Cancelled;
                order.UpdatedAt = DateTime.UtcNow;
                await _dbContext.SaveChangesAsync();
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error cancelling shipment {TrackingReference}", trackingReference);
            return false;
        }
    }

    public async Task<bool> ProcessWebhookAsync(ShipLogicWebhookPayload payload)
    {
        try
        {
            _logger.LogInformation(
                "Processing Ship Logic webhook: ShipmentId={ShipmentId}, Status={Status}, TrackingRef={TrackingRef}",
                payload.ShipmentId, payload.Status, payload.CustomTrackingReference);

            // Find the order by tracking number or Ship Logic shipment ID
            var order = await _dbContext.Orders
                .FirstOrDefaultAsync(o =>
                    o.TrackingNumber == payload.CustomTrackingReference ||
                    o.TrackingNumber == payload.ShortTrackingReference ||
                    o.ShipLogicShipmentId == payload.ShipmentId);

            if (order == null)
            {
                _logger.LogWarning(
                    "Order not found for webhook: ShipmentId={ShipmentId}, TrackingRef={TrackingRef}",
                    payload.ShipmentId, payload.CustomTrackingReference);
                return true; // Return true to acknowledge receipt
            }

            // Map Ship Logic status to our order status
            var newStatus = MapShipLogicStatusToOrderStatus(payload.Status);

            if (newStatus.HasValue && newStatus != order.Status)
            {
                order.Status = newStatus.Value;
                order.UpdatedAt = DateTime.UtcNow;

                // Update delivery dates if provided
                if (payload.CollectedDate.HasValue)
                {
                    order.ShippedDate = payload.CollectedDate;
                }
                if (payload.DeliveredDate.HasValue)
                {
                    order.DeliveredDate = payload.DeliveredDate;
                }
                if (payload.EstimatedDeliveryTo.HasValue)
                {
                    order.EstimatedDelivery = payload.EstimatedDeliveryTo.Value.ToString("yyyy-MM-dd");
                }

                await _dbContext.SaveChangesAsync();

                _logger.LogInformation(
                    "Updated order {OrderNumber} status to {Status}",
                    order.OrderNumber, newStatus);
            }

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing Ship Logic webhook");
            return false;
        }
    }

    #region Helper Methods

    private ShipLogicAddressDto MapToShipLogicAddress(ShipLogicAddress address)
    {
        return new ShipLogicAddressDto
        {
            Type = address.Type,
            Company = address.Company,
            StreetAddress = address.StreetAddress,
            LocalArea = address.LocalArea,
            City = address.City,
            Zone = address.Zone,
            Country = address.Country,
            Code = address.Code,
            Lat = address.Lat,
            Lng = address.Lng
        };
    }

    private ShipLogicAddressDto MapShippingAddressToShipLogic(ShippingAddressDto address)
    {
        return new ShipLogicAddressDto
        {
            Type = "residential",
            Company = "",
            StreetAddress = address.AddressLine1,
            LocalArea = address.AddressLine2 ?? "",
            City = address.City,
            Zone = MapProvinceToZone(address.Province),
            Country = "ZA",
            Code = address.PostalCode
        };
    }

    private string MapProvinceToZone(string? province)
    {
        if (string.IsNullOrEmpty(province)) return "GP";

        return province.ToLower() switch
        {
            "gauteng" or "gp" => "Gauteng",
            "western cape" or "wc" => "Western Cape",
            "eastern cape" or "ec" => "Eastern Cape",
            "northern cape" or "nc" => "Northern Cape",
            "kwazulu-natal" or "kwazulu natal" or "kzn" => "KwaZulu-Natal",
            "free state" or "fs" => "Free State",
            "north west" or "nw" => "North West",
            "mpumalanga" or "mp" => "Mpumalanga",
            "limpopo" or "lp" => "Limpopo",
            _ => province
        };
    }

    private decimal ApplyMarkup(decimal amount)
    {
        if (_settings.ShippingMarkupPercent <= 0) return amount;
        return amount * (1 + _settings.ShippingMarkupPercent / 100);
    }

    private string CalculateDeliveryEstimate(DateTime? from, DateTime? to)
    {
        if (!from.HasValue || !to.HasValue) return "2-5 business days";

        var now = DateTime.UtcNow;
        var daysFrom = Math.Max(1, (int)(from.Value - now).TotalDays);
        var daysTo = Math.Max(daysFrom, (int)(to.Value - now).TotalDays);

        if (daysFrom == daysTo)
        {
            return daysFrom == 1 ? "Next business day" : $"{daysFrom} business days";
        }

        return $"{daysFrom}-{daysTo} business days";
    }

    private string GetStatusDescription(string status)
    {
        return StatusDescriptions.TryGetValue(status, out var description)
            ? description
            : status.Replace("-", " ");
    }

    private OrderStatus? MapShipLogicStatusToOrderStatus(string shipLogicStatus)
    {
        return shipLogicStatus switch
        {
            "submitted" or "collection-assigned" or "collection-unassigned" => OrderStatus.Processing,
            "collected" or "at-hub" or "in-transit" or "at-destination-hub" or
            "delivery-assigned" or "out-for-delivery" or "manifested" or "ready-for-dispatch" => OrderStatus.Shipped,
            "delivered" => OrderStatus.Delivered,
            "cancelled" or "returned-to-sender" or "undeliverable" => OrderStatus.Cancelled,
            _ => null
        };
    }

    private ProofOfDeliveryDto? ExtractProofOfDelivery(ShipLogicTrackingResponse tracking)
    {
        if (tracking.DeliveredDate == null) return null;

        var deliveryEvent = tracking.TrackingEvents
            .FirstOrDefault(e => e.Status == "delivered" && e.Data != null);

        if (deliveryEvent?.Data == null)
        {
            return new ProofOfDeliveryDto
            {
                Method = "Delivered",
                DeliveredAt = tracking.DeliveredDate
            };
        }

        return new ProofOfDeliveryDto
        {
            Method = deliveryEvent.Message ?? "Delivered",
            ImageUrls = deliveryEvent.Data.Images ?? new List<string>(),
            PdfUrls = deliveryEvent.Data.Pdfs ?? new List<string>(),
            DeliveredAt = tracking.DeliveredDate
        };
    }

    #endregion
}
