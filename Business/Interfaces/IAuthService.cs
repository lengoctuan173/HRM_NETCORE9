using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Model.Models;

namespace Business.Interfaces
{
    public interface IAuthService
    {
        Task<string> AuthenticateUser(string userid, string password);
        Task<string> AuthenticateUserByMobile(string mobile, string password);
        Task<string> AuthenticateUserByEmail(string email, string password);
        Task<string> AuthenticateUserByGoogle(string email);
        Task<string> RegisterUserByMobile(string mobile, string password);
        Task<string> RegisterUserByEmail(string email, string password);
        Task<string> RegisterUserByGoogle(string email, string name);
        Task<bool> isExistUserByEmail(string email);
        Task<bool> isExistUserByMobile(string mobile);
        Task<Sycuuser> getUserByEmail(string email);
    }
}
