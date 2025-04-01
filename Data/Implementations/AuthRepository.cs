using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Data.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Models;

namespace Data.Implementations
{
    public class AuthRepository : IAuthRepository
    {
        private readonly HrmContext _context;

        public AuthRepository(HrmContext context)
        {
            _context = context;
        }

        public async Task<Sycuuser?> GetUserByUserIdAsync(string userid)
        {
            return await _context.Sycuusers.FirstOrDefaultAsync(u => u.UserId == userid);
        }
    }
}
