using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Web.Hubs;
using Twilio;
using Twilio.Rest.Api.V2010.Account;

namespace Web.Controllers
{
    [Authorize] // Chặn truy cập nếu không đăng nhập
    public class ChatController : Controller
    {
        private readonly IHubContext<ChatHub> _chatHubContext;
        private readonly IConfiguration _configuration;

        public ChatController(IHubContext<ChatHub> chatHubContext, IConfiguration configuration)
        {
            _chatHubContext = chatHubContext; // Inject SignalR Hub
            _configuration = configuration;
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

        [HttpGet]
        public async Task<IActionResult> GetTwilioToken()
        {
            try
            {
                var accountSid = _configuration["Twilio:AccountSid"];
                var authToken = _configuration["Twilio:AuthToken"];

                // Khởi tạo Twilio client
                TwilioClient.Init(accountSid, authToken);

                // Tạo token sử dụng TokenResource
                var token = await TokenResource.CreateAsync();

                // Lấy thông tin từ token
                return Json(new { 
                    token = token.IceServers.First().Url, // Lấy URL của STUN server
                    ttl = 3600, // 1 giờ
                    iceServers = token.IceServers.Select(server => new
                    {
                        urls = new[] { server.Url },
                        username = server.Username,
                        credential = server.Credential
                    }).ToArray()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
