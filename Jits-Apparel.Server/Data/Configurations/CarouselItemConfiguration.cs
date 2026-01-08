using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Jits.API.Models.Entities;

namespace Jits.API.Data.Configurations;

public class CarouselItemConfiguration : IEntityTypeConfiguration<CarouselItem>
{
    public void Configure(EntityTypeBuilder<CarouselItem> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Description)
            .HasMaxLength(1000);

        builder.Property(c => c.ImageUrl)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(c => c.ButtonText)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.LinkUrl)
            .HasMaxLength(500);

        builder.Property(c => c.GradientStyle)
            .IsRequired()
            .HasMaxLength(50)
            .HasDefaultValue("pink-orange");

        builder.Property(c => c.Order)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(c => c.IsActive)
            .HasDefaultValue(true);

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        // Create indexes for frequently queried columns
        builder.HasIndex(c => c.Order);
        builder.HasIndex(c => c.IsActive);
    }
}
