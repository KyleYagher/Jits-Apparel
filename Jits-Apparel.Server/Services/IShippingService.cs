using Jits.API.Models.DTOs;

namespace Jits.API.Services;

/// <summary>
/// Interface for shipping service integrations
/// </summary>
public interface IShippingService
{
    /// <summary>
    /// Get available shipping rates for a delivery
    /// </summary>
    /// <param name="request">Rate request with address and parcel details</param>
    /// <param name="orderSubtotal">Order subtotal for free shipping calculation</param>
    /// <returns>Available shipping rates</returns>
    Task<ShippingRatesResponse> GetRatesAsync(GetShippingRatesRequest request, decimal orderSubtotal = 0);

    /// <summary>
    /// Create a shipment/waybill
    /// </summary>
    /// <param name="request">Shipment creation request</param>
    /// <returns>Created shipment details with tracking reference</returns>
    Task<ShipmentResponse> CreateShipmentAsync(CreateShipmentRequest request);

    /// <summary>
    /// Get tracking information for a shipment
    /// </summary>
    /// <param name="trackingReference">Tracking reference (short or custom)</param>
    /// <returns>Tracking information with events</returns>
    Task<TrackingResponse> GetTrackingAsync(string trackingReference);

    /// <summary>
    /// Get the shipping label/waybill PDF URL
    /// </summary>
    /// <param name="shipmentId">Ship Logic shipment ID</param>
    /// <returns>Signed URL to download the PDF label</returns>
    Task<string> GetLabelUrlAsync(int shipmentId);

    /// <summary>
    /// Cancel a shipment (only before collection)
    /// </summary>
    /// <param name="trackingReference">Tracking reference</param>
    /// <returns>True if successfully cancelled</returns>
    Task<bool> CancelShipmentAsync(string trackingReference);

    /// <summary>
    /// Process a webhook payload from Ship Logic
    /// </summary>
    /// <param name="payload">Webhook payload</param>
    /// <returns>True if processed successfully</returns>
    Task<bool> ProcessWebhookAsync(ShipLogicWebhookPayload payload);
}
