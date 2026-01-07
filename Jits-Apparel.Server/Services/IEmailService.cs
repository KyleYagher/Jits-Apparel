namespace Jits.API.Services;

public interface IEmailService
{
    Task SendEmailVerificationAsync(string email, string callbackUrl);
    Task SendPasswordResetAsync(string email, string callbackUrl);
    Task SendWelcomeEmailAsync(string email, string firstName);
}
