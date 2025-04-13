using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Data.Interfaces;
using HRM.Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Models;

namespace Data.Implementations
{
    public class AuthRepository : IAuthRepository
    {
        private readonly HrmContext _context;
        private readonly IPasswordHasher _passwordHasher;

        public AuthRepository(HrmContext context, IPasswordHasher passwordHasher)
        {
            _context = context;
            _passwordHasher = passwordHasher;
        }

        public async Task<Sycuuser?> GetUserByUserIdAsync(string userid)
        {
            return await _context.Sycuusers.FirstOrDefaultAsync(u => u.UserId == userid);
        }
        public async Task<Sycuuser?> GetUserByMobileAsync(string mobile)
        {
            return await _context.Sycuusers.FirstOrDefaultAsync(u => u.Mobile == mobile);
        }
        public async Task<Sycuuser?> GetUserByEmailAsync(string email)
        {
            return await _context.Sycuusers.FirstOrDefaultAsync(u => u.UserEmail == email);
        }
        public async Task<Sycuuserauth?> GetUserByGoogleAsync(string email)
        {
            return await _context.Sycuuserauths.FirstOrDefaultAsync(u => u.ProviderKey == email);
        }
        public async Task<Sycuuser?> RegisterUserByMobile(string mobile,string password)
        {

            // Kiểm tra email đã tồn tại
            if (await _context.Sycuusers.AnyAsync(u => u.Mobile == mobile))
                return null;

            string newUserId = await GenerateNextUserIdAsync();
            string hashedPassword = _passwordHasher.HashPassword(password);

            // Tạo user mới
            var newUser = new Sycuuser
            {
                UserId = newUserId,
                UserEmail = mobile,
                UserName = newUserId,
                Password = hashedPassword,
                ImagePath = "default-avatar.jpg",
                CreateUid = "admin",
                CreateDt = DateTime.UtcNow
            };

            // Thêm vào bảng SYCUUSERAUTH
            var userAuth = new Sycuuserauth
            {
                Provider = 0, // 0 = local, 1 = google, 2 = facebook, v.v...
                ProviderKey = mobile,
                UserId = newUserId,
                IsActive = true,
                CreateDt = DateTime.UtcNow
            };

            _context.Sycuusers.Add(newUser);
            _context.Sycuuserauths.Add(userAuth);
            await _context.SaveChangesAsync();

            return newUser;
        }
        public async Task<Sycuuser?> RegisterUserByEmail(string email, string password)
        {

            // Kiểm tra email đã tồn tại
            if (await _context.Sycuusers.AnyAsync(u => u.UserEmail == email))
                return null;

            string newUserId = await GenerateNextUserIdAsync();
            string hashedPassword = _passwordHasher.HashPassword(password);

            // Tạo user mới
            var newUser = new Sycuuser
            {
                UserId = newUserId,
                UserEmail = email,
                UserName = newUserId,
                Password = hashedPassword,
                ImagePath = "default-avatar.jpg",
                CreateUid = "admin",
                CreateDt = DateTime.UtcNow
            };

            // Thêm vào bảng SYCUUSERAUTH
            var userAuth = new Sycuuserauth
            {
                Provider = 0, // 0 = local, 1 = google, 2 = facebook, v.v...
                ProviderKey = email,
                UserId = newUserId,
                IsActive = true,
                CreateDt = DateTime.UtcNow
            };

            _context.Sycuusers.Add(newUser);
            _context.Sycuuserauths.Add(userAuth);
            await _context.SaveChangesAsync();

            return newUser;
        }
        public async Task<Sycuuserauth?> RegisterUserByGoogle(string email, string name,string picture)
        {

            var existingUser = await _context.Sycuusers.FirstOrDefaultAsync(u => u.UserEmail == email);
            var existingAuth = await _context.Sycuuserauths.FirstOrDefaultAsync(u => u.ProviderKey == email);

            if (existingAuth != null) return null; // Đã có auth, không đăng ký lại

            var userId = existingUser?.UserId;

            if (userId == null)
            {
                var maxId = await _context.Sycuusers.MaxAsync(u => u.UserId);
                var nextId = await GenerateNextUserIdAsync();

                var newUser = new Sycuuser
                {
                    UserId = nextId,
                    UserEmail = email,
                    UserName = name ?? email,
                    ImagePath = picture ?? "default-avatar.jpg",
                    CreateDt = DateTime.UtcNow
                };
                _context.Sycuusers.Add(newUser);
                userId = nextId;
            }

            var newAuth = new Sycuuserauth
            {
                Provider = 1, // Google
                ProviderKey = email,
                UserId = userId,
                IsActive = true,
                CreateDt = DateTime.UtcNow
            };
            _context.Sycuuserauths.Add(newAuth);

            await _context.SaveChangesAsync();
            return newAuth;
        }
        public async Task<string> GenerateNextUserIdAsync()
        {
            var maxId = await _context.Sycuusers.MaxAsync(u => u.UserId);
            long nextId = string.IsNullOrEmpty(maxId) ? 1 : long.Parse(maxId) + 1;
            return nextId.ToString("D10");
        }
    }
}
