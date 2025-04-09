using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Model.Models;

namespace Data.Interfaces
{
    public interface IAuthRepository
    {
        Task<Sycuuser?> GetUserByUserIdAsync(string userid);
        Task<Sycuuser?> GetUserByMobileAsync(string mobile);
        Task<Sycuuser?> GetUserByEmailAsync(string email);
        Task<Sycuuserauth?> GetUserByGoogleAsync(string email);
        Task<Sycuuser?> RegisterUserByMobile(string mobile, string password);
        Task<Sycuuser?> RegisterUserByEmail(string email, string password);
        Task<Sycuuserauth?> RegisterUserByGoogle(string email, string name);
        Task<string> GenerateNextUserIdAsync();

    }
}
