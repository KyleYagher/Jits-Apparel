using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Jits.API.Data;
using Jits.API.Models.Configuration;
using Jits.API.Models.Entities;
using Jits.API.Services;

#if DEBUG
// Enable PII logging ONLY in debug builds
Microsoft.IdentityModel.Logging.IdentityModelEventSource.ShowPII = true;
#endif

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// Add DbContext with PostgreSQL
builder.Services.AddDbContext<JitsDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Identity
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    // Password settings
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 8;

    // Lockout settings
    options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
    options.Lockout.MaxFailedAccessAttempts = 5;
    options.Lockout.AllowedForNewUsers = true;

    // User settings
    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false; // Disabled for development
})
.AddEntityFrameworkStores<JitsDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
if (jwtSettings == null)
{
    throw new InvalidOperationException("JWT settings are not configured in appsettings.json");
}

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // IMPORTANT: Force use of JwtSecurityTokenHandler for compatibility
    // .NET 9 defaults to JsonWebTokenHandler which has different validation behavior
    options.UseSecurityTokenValidators = true;

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidAudience = jwtSettings.Audience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Add event handlers for debugging
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            var authHeader = context.Request.Headers["Authorization"].ToString();

            if (!string.IsNullOrEmpty(authHeader))
            {
                logger.LogInformation("Raw Authorization Header: '{Header}'", authHeader);
                logger.LogInformation("Header Length: {Length}", authHeader.Length);

                // Check for common issues
                if (authHeader.Contains("\r") || authHeader.Contains("\n"))
                {
                    logger.LogError("Authorization header contains line breaks!");
                }
                if (authHeader.Count(c => c == '.') != 2)
                {
                    logger.LogError("Token doesn't have 3 parts (header.payload.signature). Dot count: {Count}", authHeader.Count(c => c == '.'));
                }
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError("Authentication failed: {Error}", context.Exception.Message);
            logger.LogError("Exception Type: {Type}", context.Exception.GetType().Name);
            logger.LogError("Stack Trace: {Stack}", context.Exception.StackTrace);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogInformation("Token validated successfully for user: {User}", context.Principal?.Identity?.Name);
            return Task.CompletedTask;
        }
    };
});

// Register application services
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("https://localhost:62169", "https://localhost:62170")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Enable CORS - MUST be before Authentication/Authorization
app.UseCors("AllowFrontend");

// Enable authentication and authorization
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

// Seed database with default roles and categories
await SeedDefaultRoles(app.Services);
await SeedDefaultCategories(app.Services);
await SeedTestData(app.Services);

app.Run();

// Helper method to seed default roles
static async Task SeedDefaultRoles(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<int>>>();

    string[] roleNames = { "Admin", "Customer", "Manager" };

    foreach (var roleName in roleNames)
    {
        var roleExist = await roleManager.RoleExistsAsync(roleName);
        if (!roleExist)
        {
            await roleManager.CreateAsync(new IdentityRole<int>(roleName));
        }
    }
}

// Helper method to seed default categories
static async Task SeedDefaultCategories(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<JitsDbContext>();

    string[] categoryNames = { "Signature", "Classic", "Limited", "Politics", "Culture", "Meme", "Premium" };

    foreach (var categoryName in categoryNames)
    {
        var categoryExists = await dbContext.Categories.AnyAsync(c => c.Name == categoryName);
        if (!categoryExists)
        {
            dbContext.Categories.Add(new Category
            {
                Name = categoryName,
                Description = $"{categoryName} collection",
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    await dbContext.SaveChangesAsync();
}

// Helper method to seed test data (users, products, orders)
static async Task SeedTestData(IServiceProvider serviceProvider)
{
    using var scope = serviceProvider.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<JitsDbContext>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();

    // Check if test data already exists
    if (await dbContext.Orders.AnyAsync())
    {
        return; // Test data already seeded
    }

    // Seed test products if none exist
    if (!await dbContext.Products.AnyAsync())
    {
        var categories = await dbContext.Categories.ToListAsync();
        var signatureCategory = categories.FirstOrDefault(c => c.Name == "Signature") ?? categories.First();
        var classicCategory = categories.FirstOrDefault(c => c.Name == "Classic") ?? categories.First();
        var limitedCategory = categories.FirstOrDefault(c => c.Name == "Limited") ?? categories.First();
        var cultureCategory = categories.FirstOrDefault(c => c.Name == "Culture") ?? categories.First();

        var testProducts = new List<Product>
        {
            new Product
            {
                Name = "Jits Sunset Tee",
                Price = 599.00m,
                Description = "Premium cotton tee with vibrant sunset gradient design",
                StockQuantity = 50,
                ImageUrl = "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
                CategoryId = signatureCategory.Id,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Urban Flow Classic",
                Price = 549.00m,
                Description = "Classic fit urban streetwear essential",
                StockQuantity = 75,
                ImageUrl = "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400",
                CategoryId = classicCategory.Id,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Retro Wave Limited",
                Price = 799.00m,
                Description = "Limited edition retro wave design - only 100 made",
                StockQuantity = 25,
                ImageUrl = "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400",
                CategoryId = limitedCategory.Id,
                IsActive = true,
                IsFeatured = true,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Street Culture Hoodie",
                Price = 899.00m,
                Description = "Heavyweight hoodie with street art inspired graphics",
                StockQuantity = 40,
                ImageUrl = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400",
                CategoryId = cultureCategory.Id,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Minimal White Tee",
                Price = 449.00m,
                Description = "Clean minimal design for everyday wear",
                StockQuantity = 100,
                ImageUrl = "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400",
                CategoryId = classicCategory.Id,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            },
            new Product
            {
                Name = "Neon Nights Graphic",
                Price = 649.00m,
                Description = "Bold neon graphics that glow under UV light",
                StockQuantity = 35,
                ImageUrl = "https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400",
                CategoryId = signatureCategory.Id,
                IsActive = true,
                IsFeatured = false,
                CreatedAt = DateTime.UtcNow
            }
        };

        dbContext.Products.AddRange(testProducts);
        await dbContext.SaveChangesAsync();
    }

    // Create test users
    var testUsers = new List<(string Email, string FirstName, string LastName, string Password)>
    {
        ("john.doe@example.com", "John", "Doe", "Test123!"),
        ("jane.smith@example.com", "Jane", "Smith", "Test123!"),
        ("mike.johnson@example.com", "Mike", "Johnson", "Test123!"),
        ("sarah.williams@example.com", "Sarah", "Williams", "Test123!"),
        ("david.brown@example.com", "David", "Brown", "Test123!")
    };

    var createdUsers = new List<User>();

    foreach (var (email, firstName, lastName, password) in testUsers)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser == null)
        {
            var user = new User
            {
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                EmailConfirmed = true,
                Address = "123 Test Street",
                City = "Cape Town",
                StateOrProvince = "Western Cape",
                ZipCode = "8001",
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, "Customer");
                createdUsers.Add(user);
            }
        }
        else
        {
            createdUsers.Add(existingUser);
        }
    }

    // Get products for orders
    var products = await dbContext.Products.Take(6).ToListAsync();
    if (products.Count == 0) return;

    // Create test orders
    var random = new Random(42); // Fixed seed for reproducibility
    var statuses = new[] { OrderStatus.Pending, OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Cancelled };
    var sizes = new[] { "S", "M", "L", "XL" };
    var colors = new[] { "Black", "White", "Navy", "Grey" };

    var testOrders = new List<Order>();

    // Create 10 test orders
    for (int i = 0; i < 10; i++)
    {
        var user = createdUsers[random.Next(createdUsers.Count)];
        var status = statuses[random.Next(statuses.Length)];
        var orderDate = DateTime.UtcNow.AddDays(-random.Next(1, 30));

        var order = new Order
        {
            UserId = user.Id,
            OrderNumber = $"ORD-{orderDate:yyyyMMdd}-{Guid.NewGuid().ToString()[..8].ToUpper()}",
            OrderDate = orderDate,
            Status = status,
            Notes = i % 3 == 0 ? "Please gift wrap this order" : null,
            CreatedAt = orderDate,
            UpdatedAt = status != OrderStatus.Pending ? orderDate.AddHours(random.Next(1, 48)) : null
        };

        // Add 1-3 items per order
        var itemCount = random.Next(1, 4);
        decimal totalAmount = 0;

        for (int j = 0; j < itemCount; j++)
        {
            var product = products[random.Next(products.Count)];
            var quantity = random.Next(1, 3);
            var subtotal = product.Price * quantity;
            totalAmount += subtotal;

            order.OrderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = quantity,
                UnitPrice = product.Price,
                Subtotal = subtotal,
                Size = sizes[random.Next(sizes.Length)],
                Color = colors[random.Next(colors.Length)]
            });
        }

        order.TotalAmount = totalAmount;
        testOrders.Add(order);
    }

    dbContext.Orders.AddRange(testOrders);
    await dbContext.SaveChangesAsync();

    Console.WriteLine($"Seeded {testOrders.Count} test orders with {testOrders.Sum(o => o.OrderItems.Count)} order items");
}
