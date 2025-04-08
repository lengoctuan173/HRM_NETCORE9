using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Net;
using System.Text;
using System.Threading.Tasks;
using HRM.Core.Interfaces;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Security;
using MailKit.Net.Smtp;
using System.Text.RegularExpressions; // SmtpClient từ MailKit

namespace HRM.Core.Implementations
{
    public class EmailSender: IEmailSender
    {
        private readonly IConfiguration _configuration;

        public EmailSender(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        public async Task<bool> SendEmailKitAsync(string to, string subject, string body)
        {
            try
            {
                var email = new MimeMessage();
                email.From.Add(new MailboxAddress("HRM System", _configuration["Email:From"]));
                email.To.Add(MailboxAddress.Parse(to));
                email.Subject = subject;

                email.Body = new TextPart("html") { Text = body };

                using var smtp = new MailKit.Net.Smtp.SmtpClient();
                // Gmail đôi khi gặp lỗi xác thực chứng chỉ ⇒ bỏ kiểm tra (DEV only)
                smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;
                await smtp.ConnectAsync(
                    _configuration["Email:SmtpServer"],
                    Convert.ToInt32(_configuration["Email:Port"]),
                    SecureSocketOptions.StartTls
                );

                await smtp.AuthenticateAsync(
                    _configuration["Email:Username"],
                    _configuration["Email:Password"]
                );

                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Error sending email: {ex.Message}");
                return false;
            }
        }
    }
}
