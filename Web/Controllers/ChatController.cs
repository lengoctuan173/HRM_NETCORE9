using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Web.Hubs;

namespace Web.Controllers
{
    [Authorize] // Chặn truy cập nếu không đăng nhập
    public class ChatController : Controller
    {
        private readonly IHubContext<ChatHub> _chatHubContext;

        public ChatController(IHubContext<ChatHub> chatHubContext)
        {
            _chatHubContext = chatHubContext; // Inject SignalR Hub
        }
        public IActionResult Index()
        {
            return View();
        }
        [HttpPost]
        [Route("Chat/UploadFile")] // Định nghĩa route đầy đủ
        public async Task<IActionResult> UploadFile(IFormFile file, string senderId, string receiverId)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { success = false, message = "File không hợp lệ!" });
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot/uploads");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var fileName = $"{Guid.NewGuid()}_{file.FileName}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var fileUrl = $"{fileName}";

            // Gửi tin nhắn file qua SignalR
            await _chatHubContext.Clients.User(receiverId).SendAsync("ReceiveFileMessage", new
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                SenderName = User.Identity.Name, // Lấy tên user từ Identity
                FileUrl = fileUrl,
                Timestamp = DateTime.UtcNow.ToString("HH:mm:ss")
            });

            return Ok(new { success = true, fileUrl });
        }
    }
}
