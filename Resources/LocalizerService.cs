using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Localization;

namespace Resources
{
    public class LocalizerService
    {
        private readonly IStringLocalizer<HRMResources> _localizer;

        public LocalizerService(IStringLocalizer<HRMResources> localizer)
        {
            _localizer = localizer;
        }

        public string GetLocalizedString(string key)
        {
            return _localizer[key];
        }
    }
}
