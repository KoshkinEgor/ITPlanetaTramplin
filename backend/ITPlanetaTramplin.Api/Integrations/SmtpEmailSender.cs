using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace ITPlanetaTramplin.Api.Integrations;

internal enum EmailDispatchMode
{
    Sent,
    LoggedToConsole,
}

internal sealed record EmailDispatchResult(EmailDispatchMode Mode);

internal sealed class SmtpEmailSender
{
    private readonly SmtpOptions _options;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(
        IOptions<SmtpOptions> options,
        IWebHostEnvironment environment,
        ILogger<SmtpEmailSender> logger)
    {
        _options = options.Value;
        _environment = environment;
        _logger = logger;
    }

    public async Task<EmailDispatchResult> SendAsync(
        string toEmail,
        string subject,
        string plainTextBody,
        string htmlBody,
        CancellationToken cancellationToken)
    {
        if (!_options.IsConfigured)
        {
            if (_environment.IsDevelopment())
            {
                _logger.LogWarning(
                    "SMTP is not configured. Email to {Email} was written to the logs instead.\nSubject: {Subject}\n{Body}",
                    toEmail,
                    subject,
                    plainTextBody);

                return new EmailDispatchResult(EmailDispatchMode.LoggedToConsole);
            }

            throw new InvalidOperationException("Почтовый сервис не настроен.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_options.FromEmail!, _options.FromName ?? _options.FromEmail),
            Subject = subject,
            Body = plainTextBody,
            IsBodyHtml = false,
        };

        message.To.Add(toEmail);
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html"));

        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            EnableSsl = _options.EnableSsl,
        };

        if (!string.IsNullOrWhiteSpace(_options.Username))
        {
            client.Credentials = new NetworkCredential(_options.Username, _options.Password ?? string.Empty);
        }

        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message);

        return new EmailDispatchResult(EmailDispatchMode.Sent);
    }
}
