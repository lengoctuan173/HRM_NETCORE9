﻿using Model.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Interfaces
{
    public interface IAccountService
    {
        Task<Sycuuser> GetUserByUserIdAsync(string userid);
    }
}
