using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Security.Claims;

namespace HRM.Core.Interfaces
{
    public interface IJwtHelper
    {
        string GenerateToken(string userid, string role, string username, string imagePath);
        string GenerateRefreshToken();
        ClaimsPrincipal GetPrincipalFromExpiredToken(string token);
        bool IsTokenExpired(string token);
    }
}
