using System.Security.Claims;
using Jits.API.Models.DTOs.Auth;
using Jits.API.Models.Entities;
using Jits.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace Jits.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly RoleManager<IdentityRole<int>> _roleManager;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        RoleManager<IdentityRole<int>> roleManager,
        ITokenService tokenService,
        IEmailService emailService,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
        _tokenService = tokenService;
        _emailService = emailService;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<TokenResponse>> Register(RegisterRequest request)
    {
        try
        {
            // Check if user already exists
            if (await _userManager.FindByEmailAsync(request.Email) != null)
            {
                return BadRequest("User with this email already exists");
            }

            // Create new user
            var user = new User
            {
                UserName = request.Email,
                Email = request.Email,
                FirstName = request.FirstName,
                LastName = request.LastName,
                PhoneNumber = request.PhoneNumber,
                Address = request.Address,
                City = request.City,
                StateOrProvince = request.StateOrProvince,
                ZipCode = request.ZipCode,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Assign "Customer" role by default
            await _userManager.AddToRoleAsync(user, "Customer");

            // Generate email verification token
            var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var callbackUrl = $"{Request.Scheme}://{Request.Host}/api/auth/verify-email?userId={user.Id}&token={Uri.EscapeDataString(emailToken)}";

            // Send verification email
            await _emailService.SendEmailVerificationAsync(user.Email, callbackUrl);

            // Send welcome email
            await _emailService.SendWelcomeEmailAsync(user.Email, user.FirstName);

            _logger.LogInformation("User {Email} registered successfully", user.Email);

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            // Generate tokens (matching login behavior)
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken);

            return Ok(new TokenResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT settings
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    Roles = roles
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during user registration");
            return StatusCode(500, "An error occurred during registration");
        }
    }

    // DEV ONLY: Promote current user to Admin
    // WARNING: This endpoint is DISABLED in production for security
    [HttpPost("promote-to-admin")]
    [Authorize]
    public async Task<IActionResult> PromoteToAdmin()
    {
#if !DEBUG
        // SECURITY: This endpoint is only available in DEBUG builds
        _logger.LogWarning("Attempt to access promote-to-admin endpoint in production environment");
        return NotFound();
#else
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            // Add Admin role if not already assigned
            if (!await _userManager.IsInRoleAsync(user, "Admin"))
            {
                await _userManager.AddToRoleAsync(user, "Admin");
                _logger.LogInformation("User {Email} promoted to Admin", user.Email);
                return Ok(new { message = $"User {user.Email} promoted to Admin. Please log out and log in again to get a new token with Admin role." });
            }

            return Ok(new { message = $"User {user.Email} already has Admin role. Please log out and log in again if you recently gained this role." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error promoting user to Admin");
            return StatusCode(500, "An error occurred");
        }
#endif
    }

    [HttpPost("login")]
    public async Task<ActionResult<TokenResponse>> Login(LoginRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return Unauthorized("Invalid email or password");
            }

            // Check password
            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (result.IsLockedOut)
            {
                return Unauthorized("Account is locked due to multiple failed login attempts");
            }

            if (!result.Succeeded)
            {
                return Unauthorized("Invalid email or password");
            }

            // Check if email is confirmed (disabled for development)
            // TODO: Enable email confirmation for production
            // if (!user.EmailConfirmed)
            // {
            //     return Unauthorized("Please verify your email before logging in");
            // }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            // Generate tokens
            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken();
            await _tokenService.SaveRefreshTokenAsync(user.Id, refreshToken);

            _logger.LogInformation("User {Email} logged in successfully", user.Email);

            return Ok(new TokenResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15), // Should match JWT settings
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    Roles = roles
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during login");
            return StatusCode(500, "An error occurred during login");
        }
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<TokenResponse>> RefreshToken(RefreshTokenRequest request)
    {
        try
        {
            var refreshToken = await _tokenService.GetRefreshTokenAsync(request.RefreshToken);

            if (refreshToken == null || !refreshToken.IsActive)
            {
                return Unauthorized("Invalid or expired refresh token");
            }

            var user = refreshToken.User;
            var roles = await _userManager.GetRolesAsync(user);

            // Generate new access token
            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);

            // Optional: Rotate refresh token (revoke old, create new)
            var newRefreshToken = _tokenService.GenerateRefreshToken();
            await _tokenService.RevokeRefreshTokenAsync(request.RefreshToken);
            await _tokenService.SaveRefreshTokenAsync(user.Id, newRefreshToken);

            _logger.LogInformation("Refresh token rotated for user {Email}", user.Email);

            return Ok(new TokenResponse
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(15),
                User = new UserDto
                {
                    Id = user.Id,
                    Email = user.Email ?? string.Empty,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    EmailConfirmed = user.EmailConfirmed,
                    Roles = roles
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during token refresh");
            return StatusCode(500, "An error occurred during token refresh");
        }
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult> VerifyEmail(VerifyEmailRequest request)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(request.UserId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var result = await _userManager.ConfirmEmailAsync(user, request.Token);

            if (!result.Succeeded)
            {
                return BadRequest("Email verification failed");
            }

            _logger.LogInformation("Email verified for user {Email}", user.Email);

            return Ok(new { message = "Email verified successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during email verification");
            return StatusCode(500, "An error occurred during email verification");
        }
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            // Always return success (security best practice - don't reveal if email exists)
            if (user == null)
            {
                _logger.LogInformation("Password reset requested for non-existent email {Email}", request.Email);
                return Ok(new { message = "If the email exists, a password reset link has been sent" });
            }

            // Generate password reset token
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var callbackUrl = $"{Request.Scheme}://{Request.Host}/api/auth/reset-password?email={Uri.EscapeDataString(user.Email)}&token={Uri.EscapeDataString(resetToken)}";

            // Send password reset email
            await _emailService.SendPasswordResetAsync(user.Email, callbackUrl);

            _logger.LogInformation("Password reset email sent to {Email}", user.Email);

            return Ok(new { message = "If the email exists, a password reset link has been sent" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during forgot password");
            return StatusCode(500, "An error occurred while processing your request");
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult> ResetPassword(ResetPasswordRequest request)
    {
        try
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                return BadRequest("Invalid request");
            }

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // Revoke all refresh tokens for security
            await _tokenService.RevokeAllUserRefreshTokensAsync(user.Id);

            _logger.LogInformation("Password reset successfully for user {Email}", user.Email);

            return Ok(new { message = "Password has been reset successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during password reset");
            return StatusCode(500, "An error occurred during password reset");
        }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<ActionResult> Logout(RefreshTokenRequest request)
    {
        try
        {
            // Revoke the refresh token
            await _tokenService.RevokeRefreshTokenAsync(request.RefreshToken);

            var userEmail = User.FindFirst(ClaimTypes.Email)?.Value;
            _logger.LogInformation("User {Email} logged out", userEmail);

            return Ok(new { message = "Logged out successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred during logout");
            return StatusCode(500, "An error occurred during logout");
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound("User not found");
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                EmailConfirmed = user.EmailConfirmed,
                Roles = roles
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error occurred while getting current user");
            return StatusCode(500, "An error occurred while retrieving user information");
        }
    }
}
