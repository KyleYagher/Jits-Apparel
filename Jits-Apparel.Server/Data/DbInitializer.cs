using Jits.API.Models.Entities;
using Jits_Apparel.Server.Models.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Jits.API.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(
        JitsDbContext context,
        UserManager<User> userManager,
        RoleManager<IdentityRole<int>> roleManager)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Create roles if they don't exist
        string[] roles = { "Admin", "Customer" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole<int>(role));
            }
        }

        // Create default admin user (optional)
        var adminEmail = "admin@jits.com";
        if (await userManager.FindByEmailAsync(adminEmail) == null)
        {
            var adminUser = new User
            {
                UserName = adminEmail,
                Email = adminEmail,
                FirstName = "Admin",
                LastName = "User",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(adminUser, "Admin123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        // Create test customer user
        var testCustomerEmail = "customer@test.com";
        User? testCustomer = await userManager.FindByEmailAsync(testCustomerEmail);
        if (testCustomer == null)
        {
            testCustomer = new User
            {
                UserName = testCustomerEmail,
                Email = testCustomerEmail,
                FirstName = "John",
                LastName = "Doe",
                Address = "123 Main Street, Unit 4B",
                City = "Cape Town",
                StateOrProvince = "Western Cape",
                ZipCode = "8001",
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(testCustomer, "Customer123!");
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(testCustomer, "Customer");
            }
        }

        // Seed test orders if none exist
        await SeedTestOrdersAsync(context, testCustomer);
    }

    private static async Task SeedTestOrdersAsync(JitsDbContext context, User? testCustomer)
    {
        if (testCustomer == null) return;

        // Check if orders already exist for this user
        var existingOrders = await context.Orders.AnyAsync(o => o.UserId == testCustomer.Id);
        if (existingOrders) return;

        // Get some products to use in orders (or create if none exist)
        var products = await context.Products.Take(5).ToListAsync();
        if (products.Count == 0)
        {
            // No products to create orders with
            return;
        }

        var now = DateTime.UtcNow;

        // Order 1: Delivered order
        var order1 = new Order
        {
            OrderNumber = $"JITS-{now.Year}-0001",
            OrderDate = now.AddDays(-5),
            Status = OrderStatus.Delivered,
            TotalAmount = 1299.99m,
            Notes = "Please leave at the gate if not home.",
            CreatedAt = now.AddDays(-5),
            UpdatedAt = now.AddDays(-3),
            UserId = testCustomer.Id,
            ShippingMethod = ShippingMethod.Express,
            TrackingNumber = "TRK123456789ZA",
            EstimatedDelivery = now.AddDays(-2).ToString("yyyy-MM-dd"),
            ShippingFullName = $"{testCustomer.FirstName} {testCustomer.LastName}",
            ShippingAddressLine1 = "123 Main Street",
            ShippingAddressLine2 = "Unit 4B",
            ShippingCity = "Cape Town",
            ShippingProvince = "Western Cape",
            ShippingPostalCode = "8001",
            ShippingCountry = "South Africa",
            PaymentMethod = "Credit Card (Visa **** 4242)",
            PaymentStatus = "Paid"
        };

        // Order 2: Shipped order
        var order2 = new Order
        {
            OrderNumber = $"JITS-{now.Year}-0002",
            OrderDate = now.AddDays(-2),
            Status = OrderStatus.Shipped,
            TotalAmount = 549.99m,
            CreatedAt = now.AddDays(-2),
            UpdatedAt = now.AddDays(-1),
            UserId = testCustomer.Id,
            ShippingMethod = ShippingMethod.Express,
            TrackingNumber = "TRK987654321ZA",
            EstimatedDelivery = now.AddDays(2).ToString("yyyy-MM-dd"),
            ShippingFullName = $"{testCustomer.FirstName} {testCustomer.LastName}",
            ShippingAddressLine1 = "123 Main Street",
            ShippingAddressLine2 = "Unit 4B",
            ShippingCity = "Cape Town",
            ShippingProvince = "Western Cape",
            ShippingPostalCode = "8001",
            ShippingCountry = "South Africa",
            PaymentMethod = "PayFast",
            PaymentStatus = "Paid"
        };

        // Order 3: Processing order
        var order3 = new Order
        {
            OrderNumber = $"JITS-{now.Year}-0003",
            OrderDate = now.AddDays(-1),
            Status = OrderStatus.Processing,
            TotalAmount = 1899.99m,
            Notes = "Gift wrapping requested.",
            CreatedAt = now.AddDays(-1),
            UserId = testCustomer.Id,
            ShippingMethod = ShippingMethod.Express,
            EstimatedDelivery = now.AddDays(4).ToString("yyyy-MM-dd"),
            ShippingFullName = "Jane Smith",
            ShippingAddressLine1 = "456 Oak Avenue",
            ShippingCity = "Johannesburg",
            ShippingProvince = "Gauteng",
            ShippingPostalCode = "2000",
            ShippingCountry = "South Africa",
            PaymentMethod = "EFT",
            PaymentStatus = "Paid"
        };

        // Order 4: Pending order
        var order4 = new Order
        {
            OrderNumber = $"JITS-{now.Year}-0004",
            OrderDate = now,
            Status = OrderStatus.Pending,
            TotalAmount = 299.99m,
            CreatedAt = now,
            UserId = testCustomer.Id,
            ShippingMethod = ShippingMethod.Standard,
            ShippingFullName = $"{testCustomer.FirstName} {testCustomer.LastName}",
            ShippingAddressLine1 = "123 Main Street",
            ShippingAddressLine2 = "Unit 4B",
            ShippingCity = "Cape Town",
            ShippingProvince = "Western Cape",
            ShippingPostalCode = "8001",
            ShippingCountry = "South Africa",
            PaymentMethod = "EFT",
            PaymentStatus = "Awaiting Payment"
        };

        // Order 5: Cancelled order (from last month)
        var order5 = new Order
        {
            OrderNumber = $"JITS-{now.AddMonths(-1).Year}-0099",
            OrderDate = now.AddMonths(-1),
            Status = OrderStatus.Cancelled,
            TotalAmount = 450.00m,
            Notes = "Customer requested cancellation - wrong size ordered.",
            CreatedAt = now.AddMonths(-1),
            UpdatedAt = now.AddMonths(-1).AddHours(2),
            UserId = testCustomer.Id,
            ShippingFullName = $"{testCustomer.FirstName} {testCustomer.LastName}",
            ShippingAddressLine1 = "123 Main Street",
            ShippingCity = "Cape Town",
            ShippingProvince = "Western Cape",
            ShippingPostalCode = "8001",
            ShippingCountry = "South Africa",
            PaymentMethod = "Credit Card (Visa **** 4242)",
            PaymentStatus = "Refunded"
        };

        var orders = new List<Order> { order1, order2, order3, order4, order5 };

        await context.Orders.AddRangeAsync(orders);
        await context.SaveChangesAsync();

        // Add order items using available products
        var orderItems = new List<OrderItem>();

        // Order 1 items
        if (products.Count >= 1)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order1.Id,
                ProductId = products[0].Id,
                Quantity = 1,
                UnitPrice = 899.99m,
                Subtotal = 899.99m,
                Size = "A2",
                Color = "White"
            });
        }
        if (products.Count >= 2)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order1.Id,
                ProductId = products[1].Id,
                Quantity = 2,
                UnitPrice = 200.00m,
                Subtotal = 400.00m,
                Size = "Medium",
                Color = "Black/Cyan"
            });
        }

        // Order 2 items
        if (products.Count >= 3)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order2.Id,
                ProductId = products[2].Id,
                Quantity = 1,
                UnitPrice = 349.99m,
                Subtotal = 349.99m,
                Size = "Large",
                Color = "Navy Blue"
            });
        }
        if (products.Count >= 4)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order2.Id,
                ProductId = products[3].Id,
                Quantity = 1,
                UnitPrice = 200.00m,
                Subtotal = 200.00m,
                Size = "A2",
                Color = "Blue"
            });
        }

        // Order 3 items
        if (products.Count >= 1)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order3.Id,
                ProductId = products[0].Id,
                Quantity = 1,
                UnitPrice = 1499.99m,
                Subtotal = 1499.99m,
                Size = "A3",
                Color = "Black"
            });
        }
        if (products.Count >= 2)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order3.Id,
                ProductId = products[1].Id,
                Quantity = 2,
                UnitPrice = 200.00m,
                Subtotal = 400.00m,
                Color = "Clear"
            });
        }

        // Order 4 items
        if (products.Count >= 5)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order4.Id,
                ProductId = products[4].Id,
                Quantity = 1,
                UnitPrice = 299.99m,
                Subtotal = 299.99m,
                Color = "Black"
            });
        }
        else if (products.Count >= 1)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order4.Id,
                ProductId = products[0].Id,
                Quantity = 1,
                UnitPrice = 299.99m,
                Subtotal = 299.99m,
                Color = "Black"
            });
        }

        // Order 5 items
        if (products.Count >= 3)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order5.Id,
                ProductId = products[2].Id,
                Quantity = 1,
                UnitPrice = 450.00m,
                Subtotal = 450.00m,
                Size = "Small",
                Color = "Black/Pink"
            });
        }
        else if (products.Count >= 1)
        {
            orderItems.Add(new OrderItem
            {
                OrderId = order5.Id,
                ProductId = products[0].Id,
                Quantity = 1,
                UnitPrice = 450.00m,
                Subtotal = 450.00m,
                Size = "Small",
                Color = "Black/Pink"
            });
        }

        if (orderItems.Count > 0)
        {
            await context.OrderItems.AddRangeAsync(orderItems);
            await context.SaveChangesAsync();
        }
    }
}
