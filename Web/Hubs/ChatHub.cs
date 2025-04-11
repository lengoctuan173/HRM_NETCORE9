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
                // Join all groups the user is a member of
                var userGroups = await _chatMessageService.GetUserGroupsAsync(userid);
                foreach (var group in userGroups)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, group.GroupChatId.ToString());
                }
            }
            await UpdateUserList();
            await UpdateGroupList();
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            string userid = Context.User.Identity.Name;
            if (!string.IsNullOrEmpty(userid))
            {
                // Leave all groups
                var userGroups = await _chatMessageService.GetUserGroupsAsync(userid);
                foreach (var group in userGroups)
                {
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, group.GroupChatId.ToString());
                }
            }
            OnlineUsers.TryRemove(Context.ConnectionId, out _);
            await UpdateUserList();
            await base.OnDisconnectedAsync(exception);
        }

        private async Task UpdateUserList()
        {
            var allUsers = await _chatMessageService.getallUsersAsync();
            await Clients.All.SendAsync("UpdateUserList", allUsers, OnlineUsers.Values.ToList());
        }

        private async Task UpdateGroupList()
        {
            string userid = Context.User.Identity.Name;
            if (!string.IsNullOrEmpty(userid))
            {
                var userGroups = await _chatMessageService.GetUserGroupsAsync(userid);
                await Clients.Caller.SendAsync("UpdateGroupList", userGroups);
            }
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
        public async Task SendFileMessage(string senderId, string senderName, string receiverId, string receiverName, string fileUrl)
        {
            var senderConnection = OnlineUsers.FirstOrDefault(u => u.Value == senderId).Key;
            var receiverConnection = OnlineUsers.FirstOrDefault(u => u.Value == receiverId).Key;

            var chatMessage = new Syccchatmessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                FilePath = fileUrl,
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
                    _logger.LogError(ex, "Lỗi khi xử lý khi gửi file", senderName);
                }
            });
            var msgObject = new SyccchatmessageDto
            {
                SenderId = senderId,
                SenderName = senderName,
                ReceiverId = receiverId,
                ReceiverName = receiverName,
                Content = chatMessage.Message,
                FilePath= fileUrl,
                Timestamp = chatMessage.Timestamp?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
            };
            // Log kiểm tra
            _logger.LogInformation("📎 Gửi file từ {SenderId} đến {ReceiverId}: {FileUrl}", senderId, receiverId, fileUrl);

            if (receiverConnection != null)
            {
                await Clients.Client(receiverConnection).SendAsync("ReceiveFileMessage", msgObject);
            }

            if (senderConnection != null)
            {
                await Clients.Client(senderConnection).SendAsync("ReceiveFileMessage", msgObject);
            }
        }
        // Gửi thông tin cuộc gọi
        public async Task SendCallSignal(string senderId, string receiverId, string signalType, object signalData)
        {
            try
            {
                var receiverConnection = OnlineUsers.FirstOrDefault(u => u.Value == receiverId).Key;
                if (receiverConnection != null)
                {
                    await Clients.Client(receiverConnection).SendAsync("ReceiveCallSignal", senderId, signalType, signalData);
                }
                else
                {
                    _logger.LogWarning($"Receiver {receiverId} is not online.");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error processing SendCallSignal: {ex.Message}");
                throw;
            }
        }
        // Kết thúc cuộc gọi
        public async Task EndCall(string callerId, string receiverId)
        {
            var receiverConnection = OnlineUsers.FirstOrDefault(u => u.Value == receiverId).Key;
            if (receiverConnection != null)
            {
                await Clients.Client(receiverConnection).SendAsync("EndCall", callerId);
            }
        }

        public async Task LoadGroupMessages(string groupId)
        {
            var messages = await _chatMessageService.GetGroupMessagesAsync(groupId);
            await Clients.Caller.SendAsync("ReceiveGroupMessages", messages);
        }

        public async Task CreateGroup(string groupName, List<string> memberIds)
        {
            try
            {
                string creatorId = Context.User.Identity.Name;
                var group = await _chatMessageService.CreateGroupAsync(groupName, creatorId, memberIds);

                // Add all online members to the SignalR group
                foreach (var memberId in memberIds)
                {
                    var memberConnection = OnlineUsers.FirstOrDefault(u => u.Value == memberId).Key;
                    if (memberConnection != null)
                    {
                        await Groups.AddToGroupAsync(memberConnection, group.GroupChatId.ToString());
                    }
                }

                await Clients.Group(group.GroupChatId.ToString()).SendAsync("GroupCreated", group);
                await UpdateGroupList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating group chat");
                throw;
            }
        }

        public async Task SendGroupMessage(string groupId, string message)
        {
            var senderId = Context.User.Identity.Name;
            var senderName = Context.User.FindFirst("UserName")?.Value;

            var chatMessage = new Syccchatmessage
            {
                SenderId = senderId,
                GroupChatId = long.Parse(groupId),
                Message = message,
                Timestamp = DateTime.UtcNow
            };

            _backgroundQueueWorker.Enqueue(async (serviceProvider, token) =>
            {
                try
                {
                    using (var scope = serviceProvider.CreateScope())
                    {
                        var scopedChatMessageService = scope.ServiceProvider.GetRequiredService<IChatMessageService>();
                        await scopedChatMessageService.SaveGroupMessageAsync(chatMessage);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing group chat message", senderName);
                }
            });

            var msgObject = new SyccchatmessageDto
            {
                MessageId = chatMessage.ChatId,
                SenderId = senderId,
                SenderName = senderName,
                GroupChatId = long.Parse(groupId),
                Content = message,
                Timestamp = chatMessage.Timestamp?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
            };

            await Clients.Group(groupId).SendAsync("ReceiveGroupMessage", msgObject);
        }

        public async Task SendGroupFileMessage(string groupId, string fileUrl)
        {
            var senderId = Context.User.Identity.Name;
            var senderName = Context.User.FindFirst("UserName")?.Value;

            var chatMessage = new Syccchatmessage
            {
                SenderId = senderId,
                GroupChatId = long.Parse(groupId),
                FilePath = fileUrl,
                Timestamp = DateTime.UtcNow
            };

            _backgroundQueueWorker.Enqueue(async (serviceProvider, token) =>
            {
                try
                {
                    using (var scope = serviceProvider.CreateScope())
                    {
                        var scopedChatMessageService = scope.ServiceProvider.GetRequiredService<IChatMessageService>();
                        await scopedChatMessageService.SaveGroupMessageAsync(chatMessage);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing group file message", senderName);
                }
            });

            var msgObject = new SyccchatmessageDto
            {
                SenderId = senderId,
                SenderName = senderName,
                GroupChatId = long.Parse(groupId),
                FilePath = fileUrl,
                Timestamp = chatMessage.Timestamp?.ToString("yyyy-MM-dd HH:mm:ss") ?? ""
            };

            await Clients.Group(groupId).SendAsync("ReceiveGroupFileMessage", msgObject);
        }
    }
}
