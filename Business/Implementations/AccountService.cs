using Business.Interfaces;
using Data.Interfaces;
using HRM.Core.Interfaces;
using Model.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Implementations
{
    public class AccountService : IAccountService
    {
        private readonly IAuthRepository _authRepository;
        public AccountService(IAuthRepository authRepository)
        {
            _authRepository = authRepository;
        }
        public async Task<Sycuuser> GetUserByUserIdAsync(string userid)
        {
            var user = await _authRepository.GetUserByUserIdAsync(userid);
            return user;
        }
    }
}
