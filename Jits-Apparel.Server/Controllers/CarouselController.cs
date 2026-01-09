using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Models.Entities;
using Jits.API.Models.DTOs;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CarouselController : ControllerBase
{
    private readonly JitsDbContext _context;
    private readonly ILogger<CarouselController> _logger;
    private readonly IWebHostEnvironment _environment;

    public CarouselController(
        JitsDbContext context,
        ILogger<CarouselController> logger,
        IWebHostEnvironment environment)
    {
        _context = context;
        _logger = logger;
        _environment = environment;
    }

    // GET: api/carousel (Public - returns only active items)
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CarouselItemDto>>> GetCarouselItems()
    {
        try
        {
            var items = await _context.CarouselItems
                .Where(c => c.IsActive)
                .OrderBy(c => c.Order)
                .Select(c => new CarouselItemDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    ButtonText = c.ButtonText,
                    LinkUrl = c.LinkUrl,
                    GradientStyle = c.GradientStyle,
                    Order = c.Order,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active carousel items");
            return StatusCode(500, "An error occurred while retrieving carousel items");
        }
    }

    // GET: api/carousel/all (Admin only - returns all items)
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IEnumerable<CarouselItemDto>>> GetAllCarouselItems()
    {
        try
        {
            var items = await _context.CarouselItems
                .OrderBy(c => c.Order)
                .Select(c => new CarouselItemDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    ButtonText = c.ButtonText,
                    LinkUrl = c.LinkUrl,
                    GradientStyle = c.GradientStyle,
                    Order = c.Order,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(items);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all carousel items");
            return StatusCode(500, "An error occurred while retrieving carousel items");
        }
    }

    // GET: api/carousel/5 (Public)
    [HttpGet("{id}")]
    public async Task<ActionResult<CarouselItemDto>> GetCarouselItem(int id)
    {
        try
        {
            var item = await _context.CarouselItems
                .Where(c => c.Id == id)
                .Select(c => new CarouselItemDto
                {
                    Id = c.Id,
                    Title = c.Title,
                    Description = c.Description,
                    ImageUrl = c.ImageUrl,
                    ButtonText = c.ButtonText,
                    LinkUrl = c.LinkUrl,
                    GradientStyle = c.GradientStyle,
                    Order = c.Order,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (item == null)
                return NotFound();

            return Ok(item);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving carousel item {Id}", id);
            return StatusCode(500, "An error occurred while retrieving the carousel item");
        }
    }

    // POST: api/carousel (Admin only)
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CarouselItemDto>> CreateCarouselItem(CreateCarouselItemDto createDto)
    {
        try
        {
            // Validate gradient style
            var validGradients = new[] { "pink-orange", "orange-yellow", "yellow-cyan", "cyan-pink" };
            if (!validGradients.Contains(createDto.GradientStyle))
            {
                return BadRequest($"Invalid gradient style. Valid options: {string.Join(", ", validGradients)}");
            }

            var item = new CarouselItem
            {
                Title = createDto.Title,
                Description = createDto.Description,
                ImageUrl = createDto.ImageUrl,
                ButtonText = createDto.ButtonText,
                LinkUrl = createDto.LinkUrl,
                GradientStyle = createDto.GradientStyle,
                Order = createDto.Order,
                IsActive = createDto.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            _context.CarouselItems.Add(item);
            await _context.SaveChangesAsync();

            var itemDto = new CarouselItemDto
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                ButtonText = item.ButtonText,
                LinkUrl = item.LinkUrl,
                GradientStyle = item.GradientStyle,
                Order = item.Order,
                IsActive = item.IsActive,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };

            _logger.LogInformation("Carousel item created by {User}: {Title}", User.Identity?.Name, item.Title);

            return CreatedAtAction(nameof(GetCarouselItem), new { id = item.Id }, itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating carousel item");
            return StatusCode(500, "An error occurred while creating the carousel item");
        }
    }

    // POST: api/carousel/upload (Admin only - file upload)
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ImageUploadResponse>> UploadImage(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            // Validate file type
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(extension))
            {
                return BadRequest($"Invalid file type. Allowed types: {string.Join(", ", allowedExtensions)}");
            }

            // Validate file size (5MB max)
            if (file.Length > 5 * 1024 * 1024)
            {
                return BadRequest("File size must be less than 5MB");
            }

            // Create directory if it doesn't exist
            var uploadsFolder = Path.Combine(_environment.WebRootPath, "images", "carousel");
            Directory.CreateDirectory(uploadsFolder);

            // Generate unique filename
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return relative URL
            var imageUrl = $"/images/carousel/{fileName}";

            _logger.LogInformation("Image uploaded by {User}: {FileName}", User.Identity?.Name, fileName);

            return Ok(new ImageUploadResponse
            {
                ImageUrl = imageUrl,
                FileName = fileName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, "An error occurred while uploading the image");
        }
    }

    // PUT: api/carousel/5 (Admin only)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateCarouselItem(int id, UpdateCarouselItemDto updateDto)
    {
        try
        {
            var item = await _context.CarouselItems.FindAsync(id);
            if (item == null)
                return NotFound();

            // Validate gradient style
            var validGradients = new[] { "pink-orange", "orange-yellow", "yellow-cyan", "cyan-pink" };
            if (!validGradients.Contains(updateDto.GradientStyle))
            {
                return BadRequest($"Invalid gradient style. Valid options: {string.Join(", ", validGradients)}");
            }

            // Update properties
            item.Title = updateDto.Title;
            item.Description = updateDto.Description;
            item.ImageUrl = updateDto.ImageUrl;
            item.ButtonText = updateDto.ButtonText;
            item.LinkUrl = updateDto.LinkUrl;
            item.GradientStyle = updateDto.GradientStyle;
            item.Order = updateDto.Order;
            item.IsActive = updateDto.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Carousel item updated by {User}: {Id}", User.Identity?.Name, id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating carousel item {Id}", id);
            return StatusCode(500, "An error occurred while updating the carousel item");
        }
    }

    // DELETE: api/carousel/5 (Admin only - soft delete)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteCarouselItem(int id)
    {
        try
        {
            var item = await _context.CarouselItems.FindAsync(id);
            if (item == null)
                return NotFound();

            // Soft delete - mark as inactive
            item.IsActive = false;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Carousel item deleted by {User}: {Id}", User.Identity?.Name, id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting carousel item {Id}", id);
            return StatusCode(500, "An error occurred while deleting the carousel item");
        }
    }

    // PATCH: api/carousel/5/toggle-active (Admin only)
    [HttpPatch("{id}/toggle-active")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<CarouselItemDto>> ToggleActive(int id)
    {
        try
        {
            var item = await _context.CarouselItems.FindAsync(id);
            if (item == null)
                return NotFound();

            item.IsActive = !item.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var itemDto = new CarouselItemDto
            {
                Id = item.Id,
                Title = item.Title,
                Description = item.Description,
                ImageUrl = item.ImageUrl,
                ButtonText = item.ButtonText,
                LinkUrl = item.LinkUrl,
                GradientStyle = item.GradientStyle,
                Order = item.Order,
                IsActive = item.IsActive,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };

            _logger.LogInformation("Carousel item active status toggled by {User}: {Id} -> {IsActive}",
                User.Identity?.Name, id, item.IsActive);

            return Ok(itemDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling active status for carousel item {Id}", id);
            return StatusCode(500, "An error occurred while toggling the active status");
        }
    }

    // PATCH: api/carousel/reorder (Admin only)
    [HttpPatch("reorder")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ReorderCarouselItems(List<ReorderCarouselItemDto> reorderDtos)
    {
        try
        {
            foreach (var dto in reorderDtos)
            {
                var item = await _context.CarouselItems.FindAsync(dto.Id);
                if (item != null)
                {
                    item.Order = dto.Order;
                    item.UpdatedAt = DateTime.UtcNow;
                }
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Carousel items reordered by {User}: {Count} items",
                User.Identity?.Name, reorderDtos.Count);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reordering carousel items");
            return StatusCode(500, "An error occurred while reordering carousel items");
        }
    }
}
