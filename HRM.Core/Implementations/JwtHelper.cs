using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using HRM.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace HRM.Core.Implementations
{
    public class JwtHelper : IJwtHelper
    {
        private readonly IConfiguration _configuration;

        public JwtHelper(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(string userid, string role, string username, string imagePath)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]);
            var expiryMinutes = Convert.ToDouble(_configuration["JwtSettings:ExpiryMinutes"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                //Là thông tin trong token:
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, userid),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("UserName", username),
                    new Claim("UserImage", imagePath ?? "default-avatar.jpg")
                }),
                Expires = DateTime.UtcNow.AddMinutes(expiryMinutes), //Thời gian hết hạn
                Issuer = _configuration["JwtSettings:Issuer"], //người phát hành token
                Audience = _configuration["JwtSettings:Audience"], //  Ai sẽ dùng token này
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public string GenerateRefreshToken()
        {
            var randomNumber = new byte[32];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        public ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"])),
                ValidateIssuer = true,
                ValidIssuer = _configuration["JwtSettings:Issuer"],
                ValidateAudience = true,
                ValidAudience = _configuration["JwtSettings:Audience"],
                ValidateLifetime = false // Không kiểm tra thời gian hết hạn
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

            if (!(securityToken is JwtSecurityToken jwtSecurityToken) || 
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature, StringComparison.InvariantCultureIgnoreCase))
            {
                throw new SecurityTokenException("Invalid token");
            }

            return principal;
        }

        public bool IsTokenExpired(string token)
        {
            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;
                
                if (jwtToken == null) return true;
                
                var expirationTime = jwtToken.ValidTo;
                // Kiểm tra nếu token sắp hết hạn (còn 5 phút)
                return expirationTime <= DateTime.UtcNow.AddMinutes(5);
            }
            catch
            {
                return true;
            }
        }
    }
}
