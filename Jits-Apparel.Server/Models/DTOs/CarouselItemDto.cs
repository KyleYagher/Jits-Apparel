namespace Jits.API.Models.DTOs;

/// <summary>
/// Response DTO for CarouselItem (includes all properties)
/// </summary>
public class CarouselItemDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string GradientStyle { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

/// <summary>
/// Request DTO for creating a new CarouselItem
/// </summary>
public class CreateCarouselItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string GradientStyle { get; set; } = "pink-orange";
    public int Order { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

/// <summary>
/// Request DTO for updating an existing CarouselItem
/// </summary>
public class UpdateCarouselItemDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string GradientStyle { get; set; } = "pink-orange";
    public int Order { get; set; }
    public bool IsActive { get; set; }
}

/// <summary>
/// DTO for reordering carousel items
/// </summary>
public class ReorderCarouselItemDto
{
    public int Id { get; set; }
    public int Order { get; set; }
}

/// <summary>
/// Response DTO for image upload
/// </summary>
public class ImageUploadResponse
{
    public string ImageUrl { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
}
