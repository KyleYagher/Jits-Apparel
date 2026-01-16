using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Models.DTOs;
using Jits.API.Models.Entities;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly JitsDbContext _context;
    private readonly ILogger<SettingsController> _logger;

    public SettingsController(JitsDbContext context, ILogger<SettingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/settings (Public - limited info for checkout)
    [HttpGet]
    public async Task<ActionResult<PublicStoreSettingsDto>> GetPublicSettings()
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync();

            return Ok(new PublicStoreSettingsDto
            {
                VatRate = settings.VatRate,
                VatEnabled = settings.VatEnabled,
                FreeShippingThreshold = settings.FreeShippingThreshold,
                StoreName = settings.StoreName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving public settings");
            return StatusCode(500, "An error occurred while retrieving settings");
        }
    }

    // GET: api/settings/admin (Admin only - full settings)
    [HttpGet("admin")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StoreSettingsDto>> GetAdminSettings()
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync();

            return Ok(MapToDto(settings));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving admin settings");
            return StatusCode(500, "An error occurred while retrieving settings");
        }
    }

    // PUT: api/settings (Admin only - update settings)
    [HttpPut]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<StoreSettingsDto>> UpdateSettings([FromBody] UpdateStoreSettingsRequest request)
    {
        try
        {
            var settings = await GetOrCreateSettingsAsync();

            // Update VAT settings
            if (request.VatRate.HasValue)
            {
                if (request.VatRate.Value < 0 || request.VatRate.Value > 100)
                    return BadRequest("VAT rate must be between 0 and 100");
                settings.VatRate = request.VatRate.Value;
            }
            if (request.VatEnabled.HasValue)
                settings.VatEnabled = request.VatEnabled.Value;
            if (request.VatNumber != null)
                settings.VatNumber = request.VatNumber;

            // Update store information
            if (request.StoreName != null)
                settings.StoreName = request.StoreName;
            if (request.StoreEmail != null)
                settings.StoreEmail = request.StoreEmail;
            if (request.StorePhone != null)
                settings.StorePhone = request.StorePhone;
            if (request.StoreAddressLine1 != null)
                settings.StoreAddressLine1 = request.StoreAddressLine1;
            if (request.StoreAddressLine2 != null)
                settings.StoreAddressLine2 = request.StoreAddressLine2;
            if (request.StoreCity != null)
                settings.StoreCity = request.StoreCity;
            if (request.StoreProvince != null)
                settings.StoreProvince = request.StoreProvince;
            if (request.StorePostalCode != null)
                settings.StorePostalCode = request.StorePostalCode;
            if (request.StoreCountry != null)
                settings.StoreCountry = request.StoreCountry;

            // Update shipping settings
            if (request.FreeShippingThreshold.HasValue)
            {
                if (request.FreeShippingThreshold.Value < 0)
                    return BadRequest("Free shipping threshold cannot be negative");
                settings.FreeShippingThreshold = request.FreeShippingThreshold.Value;
            }

            settings.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Store settings updated");

            return Ok(MapToDto(settings));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating settings");
            return StatusCode(500, "An error occurred while updating settings");
        }
    }

    // Helper: Get or create default settings
    private async Task<StoreSettings> GetOrCreateSettingsAsync()
    {
        var settings = await _context.StoreSettings.FirstOrDefaultAsync();

        if (settings == null)
        {
            settings = new StoreSettings
            {
                VatRate = 15.0m,
                VatEnabled = true,
                VatNumber = "",
                StoreName = "Jits Apparel",
                FreeShippingThreshold = 500.0m,
                StoreCountry = "South Africa",
                CreatedAt = DateTime.UtcNow
            };

            _context.StoreSettings.Add(settings);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Default store settings created");
        }

        return settings;
    }

    // Helper: Map entity to DTO
    private static StoreSettingsDto MapToDto(StoreSettings settings)
    {
        return new StoreSettingsDto
        {
            VatRate = settings.VatRate,
            VatEnabled = settings.VatEnabled,
            VatNumber = settings.VatNumber,
            StoreName = settings.StoreName,
            StoreEmail = settings.StoreEmail,
            StorePhone = settings.StorePhone,
            StoreAddressLine1 = settings.StoreAddressLine1,
            StoreAddressLine2 = settings.StoreAddressLine2,
            StoreCity = settings.StoreCity,
            StoreProvince = settings.StoreProvince,
            StorePostalCode = settings.StorePostalCode,
            StoreCountry = settings.StoreCountry,
            FreeShippingThreshold = settings.FreeShippingThreshold,
            UpdatedAt = settings.UpdatedAt
        };
    }
}
