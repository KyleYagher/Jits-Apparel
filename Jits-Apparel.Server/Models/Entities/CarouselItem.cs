namespace Jits.API.Models.Entities;

public class CarouselItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string ButtonText { get; set; } = string.Empty;
    public string? LinkUrl { get; set; }
    public string GradientStyle { get; set; } = "pink-orange";
    public int Order { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
