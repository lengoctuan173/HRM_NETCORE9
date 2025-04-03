using Business.Interfaces;
using Business;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Model.Models;
using Microsoft.Extensions.Caching.Memory;
using HRM.Core.Interfaces;

namespace Web.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly HrmContext _context;
        private readonly IMemoryCache _cache;
        private readonly IEmailSender _emailSender;
        public LoginController(HrmContext context, IMemoryCache cache = null, IEmailSender emailSender = null)
        {
            _context = context;
            _cache = cache;
            _emailSender = emailSender;
        }
        [HttpPost("send-code")]
        public async Task<IActionResult> SendCode([FromBody] SendCodeRequestDto request)
        {
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest("Email is required.");

            // Tạo mã OTP ngẫu nhiên 6 chữ số
            var otp = new Random().Next(100000, 999999).ToString();

            // Lưu OTP vào cache với thời gian hết hạn là 5 phút
          //  string cacheKey = !string.IsNullOrEmpty(request.Email) ? $"OTP_{request.Email}" : $"OTP_{request.Mobile}";
           // _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(5));

            if (!string.IsNullOrEmpty(request.Email))
            {
                string subject = "Your Verification Code";
                string body = $"Your OTP code is: <b>{otp}</b>. This code is valid for 5 minutes.";

               //await _emailSender.SendEmailKitAsync(request.Email, subject, body);
            }
            else if (!string.IsNullOrEmpty(request.Mobile))
            {
                //await _smsService.SendSmsAsync(request.Mobile, $"Your OTP code is: {otp}");
            }

            return Ok(new { message = "Verification code sent successfully." });
        }
        [HttpPost("verify-code")]
        public IActionResult VerifyCode([FromBody] SendCodeRequestDto request)
        {
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.Mobile))
                return BadRequest("Email or Mobile is required.");

            //string cacheKey = !string.IsNullOrEmpty(request.Email) ? $"OTP_{request.Email}" : $"OTP_{request.Mobile}";

            //// Lấy mã OTP từ cache
            //if (!_cache.TryGetValue(cacheKey, out string storedOtp))
            //{
            //    return BadRequest("OTP is expired or invalid.");
            //}

            //// Kiểm tra xem mã OTP nhập vào có đúng không
            //if (request.Otp != storedOtp)
            //{
            //    return BadRequest("Invalid OTP.");
            //}

            //// Xóa OTP sau khi xác thực thành công
            //_cache.Remove(cacheKey);

            return Ok(new { message = "OTP verified successfully!" });
        }
    }

}
