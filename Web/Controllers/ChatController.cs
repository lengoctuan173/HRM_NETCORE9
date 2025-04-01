using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Web.Controllers
{
    [Authorize] // Chặn truy cập nếu không đăng nhập
    public class ChatController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
