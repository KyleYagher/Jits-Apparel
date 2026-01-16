using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Jits.API.Models.Entities;

namespace Jits.API.Data;

public class JitsDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public JitsDbContext(DbContextOptions<JitsDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<CarouselItem> CarouselItems => Set<CarouselItem>();
    public DbSet<StoreSettings> StoreSettings => Set<StoreSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Customize Identity table names
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<IdentityRole<int>>().ToTable("Roles");
        modelBuilder.Entity<IdentityUserRole<int>>().ToTable("UserRoles");
        modelBuilder.Entity<IdentityUserClaim<int>>().ToTable("UserClaims");
        modelBuilder.Entity<IdentityUserLogin<int>>().ToTable("UserLogins");
        modelBuilder.Entity<IdentityRoleClaim<int>>().ToTable("RoleClaims");
        modelBuilder.Entity<IdentityUserToken<int>>().ToTable("UserTokens");

        // Apply existing entity configurations
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(JitsDbContext).Assembly);
    }
}
