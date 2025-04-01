using System.Collections.Concurrent;
using Business;
using Business.Interfaces;
using HRM.Core.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Model.Models;
using Model.Models.DTOs;

namespace Web.Hubs
{
    public class ChatHub: Hub
    {
        private static ConcurrentDictionary<string, string> OnlineUsers = new ConcurrentDictionary<string, string>();
        private readonly IChatMessageService _chatMessageService;
        private readonly IBackgroundQueueWorker _backgroundQueueWorker;
        private readonly ILogger<ChatHub> _logger;
        public ChatHub(ICommonService commonService, IBackgroundQueueWorker backgroundQueueWorker, ILogger<ChatHub> logger)
        {
            _chatMessageService = commonService.GetService<IChatMessageService>();
            _backgroundQueueWorker = backgroundQueueWorker;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            string userid = Context.User.Identity.Name;
            if (!string.IsNullOrEmpty(userid))
            {
                OnlineUsers.TryAdd(Context.ConnectionId, userid);
            }
            await UpdateUserList();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            OnlineUsers.TryRemove(Context.ConnectionId, out _);
            await UpdateUserList();
            await base.OnDisconnectedAsync(exception);
        }

        private async Task UpdateUserList()
        {
            var allUsers = await _chatMessageService.getallUsersAsync();
            await Clients.All.SendAsync("UpdateUserList", allUsers, OnlineUsers.Values.ToList());
        }
        public async Task LoadOldMessages(string user1, string user2)
        {
            var messages = await _chatMessageService.GetMessagesBetweenUsersAsync(user1, user2);
            await Clients.Caller.SendAsync("ReceiveOldMessages", messages);
        }
        public async Task SendMessage(string senderId,string senderName, string senderImage, string receiverId, string receiverName, string receiverImage, string message)
        {
            var chatMessage = new Syccchatmessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message,
                Timestamp = DateTime.UtcNow
            };

            //Đẩy vào hàng đợi để xử lý sau
            _backgroundQueueWorker.Enqueue(async (serviceProvider, token) =>
            {
                try
                {
                    using (var scope = serviceProvider.CreateScope())
                    {
                        var scopedchatMessageService = scope.ServiceProvider.GetRequiredService<IChatMessageService>();
                        await scopedchatMessageService.SaveMessageAsync(chatMessage);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi xử lý chat", senderName);
                }
            });
           
            var msgObject = new SyccchatmessageDto
            {
                MessageId = chatMessage.ChatId,
                SenderId = senderId,
                SenderName = senderName,
                SenderImage = senderImage,
                ReceiverId = receiverId,
                ReceiverName = receiverName,
                ReceiverImage = receiverImage,
                Content = chatMessage.Message,
                Timestamp = chatMessage.Timestamp?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
            };
            var receiverConnection = OnlineUsers.FirstOrDefault(u => u.Value == receiverId).Key;
            if (receiverConnection != null)
            {
                await Clients.Client(receiverConnection).SendAsync("ReceiveMessage", msgObject);
            }
            await Clients.Caller.SendAsync("ReceiveMessage", msgObject);
        }
    }
}
