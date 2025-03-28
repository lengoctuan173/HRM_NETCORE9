using Microsoft.Extensions.Localization;

namespace Web.Resources
{
    public class LocalizerService
    {
        private readonly IStringLocalizer<HRMResource> _localizer;

        public LocalizerService(IStringLocalizer<HRMResource> localizer)
        {
            _localizer = localizer;
        }

        public string GetLocalizedString(string key)
        {
            return _localizer[key];
        }
    }
}
