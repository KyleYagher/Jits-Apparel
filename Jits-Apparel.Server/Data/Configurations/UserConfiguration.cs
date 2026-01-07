using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Jits.API.Models.Entities;

namespace Jits.API.Data.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        // Identity already configures: Id, Email, UserName, PhoneNumber, PasswordHash, etc.

        // Configure custom business properties
        builder.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.LastName).IsRequired().HasMaxLength(100);
        builder.Property(u => u.Address).HasMaxLength(500);
        builder.Property(u => u.City).HasMaxLength(100);
        builder.Property(u => u.StateOrProvince).HasMaxLength(50);
        builder.Property(u => u.ZipCode).HasMaxLength(10);
        builder.Property(u => u.CreatedAt).IsRequired();

        // Keep unique email index (Identity creates one, but we can customize)
        builder.HasIndex(u => u.Email).IsUnique();

        // Preserve existing relationships
        builder.HasMany(u => u.Orders)
            .WithOne(o => o.User)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
