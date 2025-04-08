using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HRM.Core.Interfaces
{
    public interface IValidationHelper
    {
        bool IsEmail(string input);
    }
}
