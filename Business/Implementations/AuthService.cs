using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Business.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Data.Interfaces;
using HRM.Core.Implementations;
using HRM.Core.Interfaces;
using Model.Models;
namespace Business.Implementations
{
    public class AuthService: IAuthService
    {
        private readonly IJwtHelper _jwtHelper;
        private readonly IAuthRepository _authRepository;
        private readonly IPasswordHasher _passwordHasher;
        public AuthService(IAuthRepository authRepository, IJwtHelper jwtHelper, IPasswordHasher passwordHasher )
        {
            _jwtHelper = jwtHelper;
            _authRepository = authRepository;
            _passwordHasher = passwordHasher;
        
        }
        public async Task<string> AuthenticateUser(string userid, string password)
        {
            var user = await _authRepository.GetUserByUserIdAsync(userid);
            if (user == null || !_passwordHasher.VerifyPassword(user.Password, password))
            {
                return null; // Sai mật khẩu hoặc không tìm thấy user
            }
            return _jwtHelper.GenerateToken(user.UserId, "admin", user.UserName, user.ImagePath);
        }
        public async Task<string> AuthenticateUserByMobile(string mobile, string password)
        {
            var user = await _authRepository.GetUserByMobileAsync(mobile);
            if (user == null || !_passwordHasher.VerifyPassword(user.Password, password))
            {
                return null; // Sai mật khẩu hoặc không tìm thấy user
            }
            return _jwtHelper.GenerateToken(user.UserId, "admin", user.UserName, user.ImagePath);
        }
        public async Task<string> AuthenticateUserByEmail(string email, string password)
        {
            var user = await _authRepository.GetUserByEmailAsync(email);
            if (user == null || !_passwordHasher.VerifyPassword(user.Password, password))
            {
                return null; // Sai mật khẩu hoặc không tìm thấy user
            }
            return _jwtHelper.GenerateToken(user.UserId, "admin", user.UserName, user.ImagePath);
        }
        public async Task<string> RegisterUserByMobile(string mobile, string password)
        {
            var user = await _authRepository.RegisterUserByMobile(mobile, password);
            if (user == null || !_passwordHasher.VerifyPassword(user.Password, password))
            {
                return null; // Sai mật khẩu hoặc không tìm thấy user
            }
            return _jwtHelper.GenerateToken(user.UserId, "admin", user.UserName, user.ImagePath);
        }
        public async Task<string> RegisterUserByEmail(string email, string password)
        {
            var user = await _authRepository.RegisterUserByEmail(email, password);
            if (user == null || !_passwordHasher.VerifyPassword(user.Password, password))
            {
                return null; // Sai mật khẩu hoặc không tìm thấy user
            }
            return _jwtHelper.GenerateToken(user.UserId, "admin", user.UserName, user.ImagePath);
        }
    }
}
