using EduGuard.Application.DTOs.Settings;
using FluentValidation;

namespace EduGuard.Application.Validators;

public class UpdateEmailSettingsRequestValidator : AbstractValidator<UpdateEmailSettingsRequest>
{
    public UpdateEmailSettingsRequestValidator()
    {
        RuleFor(x => x.Host).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Port).InclusiveBetween(1, 65535);
        RuleFor(x => x.Username).MaximumLength(256);
        RuleFor(x => x.FromAddress).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FromName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.OtpLength).InclusiveBetween(4, 8);
        RuleFor(x => x.OtpExpiryMinutes).InclusiveBetween(1, 60);
        RuleFor(x => x.ResendCooldownSeconds).InclusiveBetween(15, 600);
    }
}

public class SendTestEmailRequestValidator : AbstractValidator<SendTestEmailRequest>
{
    public SendTestEmailRequestValidator()
    {
        RuleFor(x => x.RecipientEmail).NotEmpty().EmailAddress();
    }
}
