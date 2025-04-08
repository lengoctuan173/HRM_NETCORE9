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
        public async Task<Sycuuser?> RegisterUserByMobile(string mobile,string password)
        {

            // Kiểm tra số email đã tồn tại chưa
            var existingUser = await _context.Sycuusers.FirstOrDefaultAsync(u => u.Mobile == mobile);
            if (existingUser != null)
            {
                return null; // User đã tồn tại
            }

            // Mã hóa mật khẩu (bạn nên dùng một thư viện như BCrypt hoặc tự viết)
            string hashedPassword = _passwordHasher.HashPassword(password);

            // Lấy UserId lớn nhất hiện tại
            var maxUser = await _context.Sycuusers
                .OrderByDescending(u => u.UserId)
                .Select(u => u.UserId)
                .FirstOrDefaultAsync();
            // Nếu chưa có user nào thì bắt đầu từ 1
            long nextId = 1;
            if (!string.IsNullOrEmpty(maxUser) && long.TryParse(maxUser, out long currentId))
            {
                nextId = currentId + 1;
            }

            string newUserId = nextId.ToString("D10"); // Định dạng thành 10 chữ số

            // Tạo user mới
            var newUser = new Sycuuser
            {
                UserId = newUserId,
                UserName = newUserId,
                Mobile = mobile,
                Password = hashedPassword,
                ImagePath = "default-avatar.jpg",
                CreateUid = "admin",
                CreateDt = DateTime.UtcNow,
                // Thêm các field mặc định khác nếu có
            };

            // Thêm vào DB
            _context.Sycuusers.Add(newUser);
            await _context.SaveChangesAsync();

            return newUser;
        }
        public async Task<Sycuuser?> RegisterUserByEmail(string email, string password)
        {
            // Kiểm tra số email đã tồn tại chưa
            var existingUser = await _context.Sycuusers.FirstOrDefaultAsync(u => u.UserEmail == email);
            if (existingUser != null)
            {
                return null; // User đã tồn tại
            }

            // Mã hóa mật khẩu (bạn nên dùng một thư viện như BCrypt hoặc tự viết)
            string hashedPassword = _passwordHasher.HashPassword(password);

            // Lấy UserId lớn nhất hiện tại
            var maxUser = await _context.Sycuusers
                .OrderByDescending(u => u.UserId)
                .Select(u => u.UserId)
                .FirstOrDefaultAsync();
            // Nếu chưa có user nào thì bắt đầu từ 1
            long nextId = 1;
            if (!string.IsNullOrEmpty(maxUser) && long.TryParse(maxUser, out long currentId))
            {
                nextId = currentId + 1;
            }

            string newUserId = nextId.ToString("D10"); // Định dạng thành 10 chữ số

            // Tạo user mới
            var newUser = new Sycuuser
            {
                UserId = newUserId,
                UserEmail = email,
                UserName = newUserId,
                Password = hashedPassword,
                ImagePath = "default-avatar.jpg",
                CreateUid = "admin",
                CreateDt = DateTime.UtcNow,
                // Thêm các field mặc định khác nếu có
            };

            // Thêm vào DB
            _context.Sycuusers.Add(newUser);
            await _context.SaveChangesAsync();

            return newUser;
        }
    }
}
