using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Model.Models;
using Data.Interfaces;
using Business.Interfaces;
using Web.Helper;
using Business;
using Microsoft.AspNetCore.Http;
using HRM.Core.Interfaces;
using Model.Models.DTOs;
using Resources;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Security.Claims;
using Newtonsoft.Json.Linq;

namespace Web.Controllers
{
    public class LoginController : Controller
    {
        private readonly IAuthService _authService;
        private readonly IValidationHelper _validationHelper;
        private readonly LocalizerService _localizerService;
        private readonly IPasswordHasher _passwordHasher;
        public LoginController(ICommonService commonService, IValidationHelper validationHelper, LocalizerService localizerService, IPasswordHasher passwordHasher)
        {
            _authService = commonService.GetService<IAuthService>();
            _validationHelper = validationHelper;
            _localizerService = localizerService;
            _passwordHasher = passwordHasher;
        }
        public IActionResult Index()
        {
            // Kiểm tra nếu đã đăng nhập (có token trong cookie)
            if (Request.Cookies.ContainsKey("JwtToken"))
            {
                return RedirectToAction("Index", "Chat"); // Chuyển hướng đến trang Home
            }
            return View();
        }
        public IActionResult Signup()
        {
            return View();
        }
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Login(SycuuserDto model)
        {
            var token = string.Empty;
            if (_validationHelper.IsEmail(model.UserId))
            {
                token = await _authService.AuthenticateUserByEmail(model.UserId, model.Password);
            }
            else
            {
                token = await _authService.AuthenticateUserByMobile(model.UserId, model.Password);
            }
            if (token == null)
            {
                //ViewBag.Error = "Sai tài khoản hoặc mật khẩu!";
                TempData["LoginError"] = _localizerService.GetLocalizedString("Login_Err");
                return RedirectToAction("Index", "Login");
            }
            // Lưu Token vào Cookie (gọi hàm tiện ích)
            CookieHelper.SetToken(Response, token, Request.IsHttps);

            // Chuyển hướng đến trang Home sau khi đăng nhập thành công
            return RedirectToAction("Index", "Chat");
        }
        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Signup([FromBody] SigupRequestDto model)
        {
            var isResult = true;
            var token = string.Empty;
            if (model.isEmail)
            {
                 token = await _authService.RegisterUserByEmail(model.Email, model.Password);
            }
            else
            {
                token = await _authService.RegisterUserByMobile(model.Mobile, model.Password);
            }

            if (token == null)
            {
                isResult = false;
                ViewBag.Error = "Sai tài khoản hoặc mật khẩu!";
                return View("Index"); // Hiển thị lại trang login với thông báo lỗi
            }
            // Lưu Token vào Cookie (gọi hàm tiện ích)
            CookieHelper.SetToken(Response, token, Request.IsHttps);

            // Chuyển hướng đến trang Home sau khi đăng nhập thành công
            return Ok(new { isResult,message = "Verification code sent successfully." });
        }
        [AllowAnonymous]
        public async Task<IActionResult> Logout()
        {
            CookieHelper.RemoveToken(Response); // Xóa Token khỏi Cookie
            return RedirectToAction("Index", "Login");
        }
        [HttpGet]
        public IActionResult GoogleLogin()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("GoogleCallback", "Login", null, Request.Scheme)
            };
            return Challenge(properties, "Google");
        }
        [HttpGet]
        public async Task<IActionResult> GoogleCallback()
        {
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!result.Succeeded)
                return BadRequest("Google authentication failed");
            var token = string.Empty;
            var email = result.Principal.FindFirst(ClaimTypes.Email)?.Value;
            var name = result.Principal.Identity.Name;
            var picture = result.Principal.FindFirst("picture")?.Value; ; // Get profile image URL
            token = await _authService.AuthenticateUserByGoogle(email);
            if (token == null)
            {
                try
                {
                    token = await _authService.RegisterUserByGoogle(email, name, picture); // Pass picture URL to registration
                }
                catch {
                    TempData["LoginError"] = _localizerService.GetLocalizedString("Login_Err");
                    return RedirectToAction("Index", "Login");
                }
            }
            // Lưu Token vào Cookie (gọi hàm tiện ích)
            CookieHelper.SetToken(Response, token, Request.IsHttps);

            // Chuyển hướng đến trang Home sau khi đăng nhập thành công
            return RedirectToAction("Index", "Chat");
        }
        [HttpGet]
        public IActionResult FacebookLogin()
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action("FacebookCallback", "Login", null, Request.Scheme)
            };
            return Challenge(properties, "Facebook");
        }
        [HttpGet]
        public async Task<IActionResult> FacebookCallback()
        {
            var result = await HttpContext.AuthenticateAsync("Facebook");

            if (!result.Succeeded)
                return RedirectToAction("Login");

            // Xử lý thông tin người dùng từ Facebook (ví dụ: email, name)
            var name = result.Principal?.FindFirstValue(ClaimTypes.Name);
            var email = result.Principal?.FindFirstValue(ClaimTypes.Email);
            var picture = result.Principal.FindFirst("picture")?.Value; // Get profile image URL
            var token = string.Empty;
            token = await _authService.AuthenticateUserByGoogle(email);
            if (token == null)
            {
                try
                {
                    token = await _authService.RegisterUserByGoogle(email, name, picture);
                }
                catch
                {
                    //ViewBag.Error = "Sai tài khoản hoặc mật khẩu!";
                    TempData["LoginError"] = _localizerService.GetLocalizedString("Login_Err");
                    return RedirectToAction("Index", "Login");
                }
            }
            // Lưu Token vào Cookie (gọi hàm tiện ích)
            CookieHelper.SetToken(Response, token, Request.IsHttps);

            // Chuyển hướng đến trang Home sau khi đăng nhập thành công
            return RedirectToAction("Index", "Chat");
        }
    }
}
