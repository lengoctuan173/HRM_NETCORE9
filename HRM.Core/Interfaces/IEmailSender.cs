﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HRM.Core.Interfaces
{
    public interface IEmailSender
    {
        Task<bool> SendEmailKitAsync(string to, string subject, string body);
    }
}
