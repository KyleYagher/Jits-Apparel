using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Jits.API.Data;
using Jits.API.Models.Entities;
using Jits.API.Models.DTOs;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly JitsDbContext _context;
    private readonly ILogger<ProductsController> _logger;

    public ProductsController(JitsDbContext context, ILogger<ProductsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/products
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    Description = p.Description,
                    StockQuantity = p.StockQuantity,
                    ImageUrl = p.ImageUrl,
                    IsActive = p.IsActive,
                    IsFeatured = p.IsFeatured,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CategoryId = p.CategoryId,
                    Category = new CategoryDto
                    {
                        Id = p.Category.Id,
                        Name = p.Category.Name
                    }
                })
                .ToListAsync();

            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, "An error occurred while retrieving products");
        }
    }

    // GET: api/products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Product>> GetProduct(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound();

            return Ok(product);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, "An error occurred while retrieving the product");
        }
    }

    // GET: api/products/category/5
    [HttpGet("category/{categoryId}")]
    public async Task<ActionResult<IEnumerable<Product>>> GetProductsByCategory(int categoryId)
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.CategoryId == categoryId && p.IsActive)
                .ToListAsync();

            return Ok(products);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving products for category {CategoryId}", categoryId);
            return StatusCode(500, "An error occurred while retrieving products");
        }
    }

    // POST: api/products
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createProductDto)
    {
        try
        {
            // Validate that the category exists
            var categoryExists = await _context.Categories.AnyAsync(c => c.Id == createProductDto.CategoryId);
            if (!categoryExists)
            {
                return BadRequest($"Category with ID {createProductDto.CategoryId} does not exist");
            }

            var product = new Product
            {
                Name = createProductDto.Name,
                Price = createProductDto.Price,
                Description = createProductDto.Description,
                StockQuantity = createProductDto.StockQuantity,
                ImageUrl = createProductDto.ImageUrl,
                CategoryId = createProductDto.CategoryId,
                IsActive = createProductDto.IsActive,
                IsFeatured = createProductDto.IsFeatured,
                CreatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Load the category for the response
            await _context.Entry(product).Reference(p => p.Category).LoadAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Description = product.Description,
                StockQuantity = product.StockQuantity,
                ImageUrl = product.ImageUrl,
                IsActive = product.IsActive,
                IsFeatured = product.IsFeatured,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                CategoryId = product.CategoryId,
                Category = new CategoryDto
                {
                    Id = product.Category.Id,
                    Name = product.Category.Name
                }
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, "An error occurred while creating the product");
        }
    }

    // PUT: api/products/5
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateProduct(int id, Product product)
    {
        if (id != product.Id)
            return BadRequest();

        try
        {
            product.UpdatedAt = DateTime.UtcNow;
            _context.Entry(product).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!await ProductExists(id))
                return NotFound();
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, "An error occurred while updating the product");
        }
    }

    // DELETE: api/products/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        try
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound();

            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, "An error occurred while deleting the product");
        }
    }

    // PATCH: api/products/5/toggle-featured
    [HttpPatch("{id}/toggle-featured")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductDto>> ToggleFeatured(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return NotFound();

            product.IsFeatured = !product.IsFeatured;
            product.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Price = product.Price,
                Description = product.Description,
                StockQuantity = product.StockQuantity,
                ImageUrl = product.ImageUrl,
                IsActive = product.IsActive,
                IsFeatured = product.IsFeatured,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                CategoryId = product.CategoryId,
                Category = new CategoryDto
                {
                    Id = product.Category.Id,
                    Name = product.Category.Name
                }
            };

            return Ok(productDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error toggling featured status for product {ProductId}", id);
            return StatusCode(500, "An error occurred while updating the product");
        }
    }

    // GET: api/products/test-auth
    [HttpGet("test-auth")]
    [Authorize]
    public IActionResult TestAuth()
    {
        var userRoles = User.Claims
            .Where(c => c.Type == System.Security.Claims.ClaimTypes.Role)
            .Select(c => c.Value)
            .ToList();

        return Ok(new
        {
            IsAuthenticated = User.Identity?.IsAuthenticated ?? false,
            UserName = User.Identity?.Name,
            Roles = userRoles,
            IsAdmin = User.IsInRole("Admin")
        });
    }

    // POST: api/products/upload
    [HttpPost("upload")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ProductUploadResult>> UploadProducts([FromBody] List<ProductUploadDto> products)
    {
        _logger.LogInformation("Product upload initiated by {UserName} for {Count} products",
            User.Identity?.Name, products.Count);

        var result = new ProductUploadResult();

        try
        {
            for (int i = 0; i < products.Count; i++)
            {
                var productDto = products[i];

                try
                {
                    // Validate required fields
                    if (string.IsNullOrWhiteSpace(productDto.Name))
                    {
                        result.DetailedErrors.Add(new ProductUploadError
                        {
                            RowNumber = i + 2, // +2 because row 1 is header and array is 0-indexed
                            ProductName = productDto.Name,
                            Error = "Product name is required"
                        });
                        result.FailureCount++;
                        continue;
                    }

                    if (productDto.Price <= 0)
                    {
                        result.DetailedErrors.Add(new ProductUploadError
                        {
                            RowNumber = i + 2,
                            ProductName = productDto.Name,
                            Error = "Price must be greater than zero"
                        });
                        result.FailureCount++;
                        continue;
                    }

                    // Check if category exists
                    var categoryExists = await _context.Categories.AnyAsync(c => c.Id == productDto.CategoryId);
                    if (!categoryExists)
                    {
                        result.DetailedErrors.Add(new ProductUploadError
                        {
                            RowNumber = i + 2,
                            ProductName = productDto.Name,
                            Error = $"Category with ID {productDto.CategoryId} does not exist"
                        });
                        result.FailureCount++;
                        continue;
                    }

                    // Create new product
                    var product = new Product
                    {
                        Name = productDto.Name,
                        Price = productDto.Price,
                        Description = productDto.Description,
                        StockQuantity = productDto.StockQuantity,
                        ImageUrl = productDto.ImageUrl,
                        CategoryId = productDto.CategoryId,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Products.Add(product);
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing product at row {RowNumber}", i + 2);
                    result.DetailedErrors.Add(new ProductUploadError
                    {
                        RowNumber = i + 2,
                        ProductName = productDto.Name,
                        Error = $"Internal error: {ex.Message}"
                    });
                    result.FailureCount++;
                }
            }

            // Save all valid products to database
            if (result.SuccessCount > 0)
            {
                await _context.SaveChangesAsync();
            }

            // Generate summary messages
            result.Errors = result.DetailedErrors
                .Select(e => $"Row {e.RowNumber} ({e.ProductName}): {e.Error}")
                .ToList();

            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during bulk product upload");
            return StatusCode(500, new ProductUploadResult
            {
                SuccessCount = 0,
                FailureCount = products.Count,
                Errors = new List<string> { "An error occurred while uploading products. Please try again." }
            });
        }
    }

    private async Task<bool> ProductExists(int id)
    {
        return await _context.Products.AnyAsync(e => e.Id == id);
    }
}
