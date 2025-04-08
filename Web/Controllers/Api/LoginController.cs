using Business.Interfaces;
using Business;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Model.Models;
using Microsoft.Extensions.Caching.Memory;
using HRM.Core.Interfaces;
using static System.Net.WebRequestMethods;

namespace Web.Controllers.Api
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly IMemoryCache _cache;
        private readonly IEmailSender _emailSender;
        private readonly IAuthService _authService;
        public LoginController(IMemoryCache cache = null, IEmailSender emailSender = null, ICommonService commonService = null)
        {
            _cache = cache;
            _emailSender = emailSender;
            _authService = commonService.GetService<IAuthService>();
        }
        [HttpPost("send-code")]
        public async Task<IActionResult> SendCode([FromBody] SendCodeRequestDto request)
        {
            var isResult = false;
            if (string.IsNullOrEmpty(request.Email))
                return BadRequest("Email is required.");
            if(await _authService.isExistUserByEmail(request.Email)) // Email exist - > login
            {
                return Ok(new { isResult, isExist = true, message = "Email is exists." });
            }    
            // Tạo mã OTP ngẫu nhiên 6 chữ số
            var otp = new Random().Next(100000, 999999).ToString();
            // Lưu OTP vào cache với thời gian hết hạn là 5 phút
            string cacheKey = !string.IsNullOrEmpty(request.Email) ? $"OTP_{request.Email}" : $"OTP_{request.Mobile}";
            _cache.Set(cacheKey, otp, TimeSpan.FromMinutes(1));

            if (!string.IsNullOrEmpty(request.Email))
            {
                string subject = "Your Verification Code";
                string body = $"Your OTP code is: <b>{otp}</b>. This code is valid for 1 minutes.";
                isResult = await _emailSender.SendEmailKitAsync(request.Email, subject, body);
            }
            else if (!string.IsNullOrEmpty(request.Mobile))
            {
                //await _smsService.SendSmsAsync(request.Mobile, $"Your OTP code is: {otp}");
            }

            return Ok(new { message = "Verification code sent successfully.", isResult});
        }
        [HttpPost("verify-code")]
        public IActionResult VerifyCode([FromBody] SendCodeRequestDto request)
        {
            var isResult = true;
            if (string.IsNullOrEmpty(request.Email) && string.IsNullOrEmpty(request.Mobile))
                return BadRequest("Email or Mobile is required.");
            string cacheKey = !string.IsNullOrEmpty(request.Email) ? $"OTP_{request.Email}" : $"OTP_{request.Mobile}";
            // Lấy mã OTP từ cache
            if (!_cache.TryGetValue(cacheKey, out string storedOtp))
            {
                return BadRequest("OTP is expired or invalid.");
            }
            // Kiểm tra xem mã OTP nhập vào có đúng không
            if (request.Otp != storedOtp)
            {
                isResult = false;
                //return BadRequest("Invalid OTP.");
            }
            else
            {
                //Xóa OTP sau khi xác thực thành công
                _cache.Remove(cacheKey);
            }    
           
            return Ok(new { message = "OTP verified successfully!", isResult });
        }
    }

}
