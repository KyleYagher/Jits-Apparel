using Jits.API.Models.Configuration;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

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
        var subject = "Verify your email address - Jits Apparel";
        var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #2563eb;'>Welcome to Jits Apparel!</h2>
                    <p>Please verify your email address by clicking the button below:</p>
                    <p style='margin: 30px 0;'>
                        <a href='{callbackUrl}'
                           style='background-color: #2563eb; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;'>
                            Verify Email Address
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #666;'>{callbackUrl}</p>
                    <p style='margin-top: 30px; font-size: 12px; color: #999;'>
                        If you didn't create an account with Jits Apparel, you can safely ignore this email.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendPasswordResetAsync(string email, string callbackUrl)
    {
        var subject = "Reset your password - Jits Apparel";
        var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #2563eb;'>Password Reset Request</h2>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <p style='margin: 30px 0;'>
                        <a href='{callbackUrl}'
                           style='background-color: #2563eb; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;'>
                            Reset Password
                        </a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style='word-break: break-all; color: #666;'>{callbackUrl}</p>
                    <p style='margin-top: 30px; font-size: 12px; color: #999;'>
                        If you didn't request a password reset, you can safely ignore this email.
                        Your password will remain unchanged.
                    </p>
                    <p style='font-size: 12px; color: #999;'>
                        This link will expire in 1 hour for security reasons.
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        var subject = "Welcome to Jits Apparel!";
        var htmlBody = $@"
            <html>
            <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
                <div style='max-width: 600px; margin: 0 auto; padding: 20px;'>
                    <h2 style='color: #2563eb;'>Welcome, {firstName}!</h2>
                    <p>Thank you for joining Jits Apparel. We're excited to have you as part of our community!</p>
                    <p>Here's what you can do now:</p>
                    <ul>
                        <li>Browse our latest collections</li>
                        <li>Add items to your wishlist</li>
                        <li>Get exclusive member discounts</li>
                    </ul>
                    <p style='margin: 30px 0;'>
                        <a href='https://jitsapparel.co.za/shop'
                           style='background-color: #2563eb; color: white; padding: 12px 24px;
                                  text-decoration: none; border-radius: 6px; display: inline-block;'>
                            Start Shopping
                        </a>
                    </p>
                    <p style='margin-top: 30px; font-size: 12px; color: #999;'>
                        Questions? Reply to this email or contact us at support@jitsapparel.co.za
                    </p>
                </div>
            </body>
            </html>";

        await SendEmailAsync(email, subject, htmlBody);
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        // If email sending is disabled (e.g., in development), just log and return
        if (!_emailSettings.Enabled)
        {
            _logger.LogInformation(
                "[Email Disabled] Would send email to {Email} with subject: {Subject}",
                toEmail, subject);
            return;
        }

        // Validate configuration
        if (string.IsNullOrEmpty(_emailSettings.SmtpHost))
        {
            _logger.LogError("SMTP host is not configured. Cannot send email to {Email}", toEmail);
            throw new InvalidOperationException("Email service is not properly configured. SMTP host is missing.");
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.FromEmail));
            message.To.Add(new MailboxAddress(toEmail, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlBody
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            // Connect with appropriate security
            var secureSocketOptions = _emailSettings.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            await client.ConnectAsync(
                _emailSettings.SmtpHost,
                _emailSettings.SmtpPort,
                secureSocketOptions);

            // Authenticate if credentials are provided
            if (!string.IsNullOrEmpty(_emailSettings.Username))
            {
                await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
            }

            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email} with subject: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email} with subject: {Subject}", toEmail, subject);
            throw;
        }
    }
}
