using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Model.Models;
using Data.Interfaces;
using Business.Interfaces;
using Web.Helper;
using Business;

namespace Web.Controllers
{
    public class LoginController : Controller
    {
        private readonly IAuthService _authService;
        public LoginController(ICommonService commonService)
        {
          _authService = commonService.GetService<IAuthService>();
        }
        public IActionResult Index()
        {
            // Kiểm tra nếu đã đăng nhập (có token trong cookie)
            if (Request.Cookies.ContainsKey("JwtToken"))
            {
                return RedirectToAction("Index", "Home"); // Chuyển hướng đến trang Home
            }
            return View();
        }
        public IActionResult Signup()
        {
            return View();
        }
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login(Sycuuser model)
        {
            var token =  await _authService.AuthenticateUser(model.UserId, model.Password);
            if (token == null)
            {
                ViewBag.Error = "Sai tài khoản hoặc mật khẩu!";
                return View("Index"); // Hiển thị lại trang login với thông báo lỗi
            }
            // Lưu Token vào Cookie (gọi hàm tiện ích)
            CookieHelper.SetToken(Response, token, Request.IsHttps);

            // Chuyển hướng đến trang Home sau khi đăng nhập thành công
            return RedirectToAction("Index", "Home");
        }
        [AllowAnonymous]
        public async Task<IActionResult> Logout()
        {
            CookieHelper.RemoveToken(Response); // Xóa Token khỏi Cookie
            return RedirectToAction("Index", "Login");
        }
    }
}
