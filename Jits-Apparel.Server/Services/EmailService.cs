using Jits.API.Models.Configuration;
using Microsoft.Extensions.Options;

namespace Jits.API.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
        _emailSettings = emailSettings.Value;
        _logger = logger;
    }

    public async Task SendEmailVerificationAsync(string email, string callbackUrl)
    {
        // Development stub - logs to console instead of sending actual email
        _logger.LogInformation("===== EMAIL VERIFICATION =====");
        _logger.LogInformation("To: {Email}", email);
        _logger.LogInformation("Subject: Verify your email address");
        _logger.LogInformation("Body: Please verify your email by clicking the link below:");
        _logger.LogInformation("Link: {CallbackUrl}", callbackUrl);
        _logger.LogInformation("==============================");

        // TODO: In production, implement actual SMTP email sending using:
        // - System.Net.Mail.SmtpClient, or
        // - MailKit (recommended), or
        // - Email service API (SendGrid, AWS SES, Mailgun, etc.)

        await Task.CompletedTask;
    }

    public async Task SendPasswordResetAsync(string email, string callbackUrl)
    {
        // Development stub - logs to console instead of sending actual email
        _logger.LogInformation("===== PASSWORD RESET =====");
        _logger.LogInformation("To: {Email}", email);
        _logger.LogInformation("Subject: Reset your password");
        _logger.LogInformation("Body: Reset your password by clicking the link below:");
        _logger.LogInformation("Link: {CallbackUrl}", callbackUrl);
        _logger.LogInformation("==========================");

        // TODO: In production, implement actual SMTP email sending

        await Task.CompletedTask;
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        // Development stub - logs to console instead of sending actual email
        _logger.LogInformation("===== WELCOME EMAIL =====");
        _logger.LogInformation("To: {Email}", email);
        _logger.LogInformation("Subject: Welcome to Jits!");
        _logger.LogInformation("Body: Welcome {FirstName}! Thank you for joining Jits.", firstName);
        _logger.LogInformation("=========================");

        // TODO: In production, implement actual SMTP email sending

        await Task.CompletedTask;
    }
}
