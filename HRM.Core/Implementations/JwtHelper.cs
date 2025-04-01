using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
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

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                //Là thông tin trong token:
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Name, userid),
                    new Claim(ClaimTypes.Role, role),
                    new Claim("UserName", username),
                    new Claim("UserImage", imagePath)
                }),
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpiryMinutes"])), //Thời gian hết hạn
                Issuer = _configuration["JwtSettings:Issuer"], //người phát hành token
                Audience = _configuration["JwtSettings:Audience"], //  Ai sẽ dùng token này
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
