using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Data.Interfaces;
using Microsoft.EntityFrameworkCore;
using Model.Models;
using Model.Models.DTOs;

namespace Data.Implementations
{
    public class ChatMessageRepository: IChatMessageRepository
    {
        private readonly HrmContext _context;
        public ChatMessageRepository(HrmContext context) { 
            _context = context;
        }
        public async Task<List<SyccchatmessageDto>> GetMessagesBetweenUsersAsync(string user1, string user2)
        {
            return await _context.Syccchatmessages
                .Where(m => (m.SenderId == user1 && m.ReceiverId == user2) || (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.Timestamp)
                .Join(_context.Sycuusers, m => m.SenderId, u => u.UserId, (m, sender) => new { m, sender })
                .Join(_context.Sycuusers, temp => temp.m.ReceiverId, u => u.UserId, (temp, receiver) => new SyccchatmessageDto
                {
                    MessageId = temp.m.ChatId,
                    SenderId = temp.m.SenderId,
                    SenderName = temp.sender.UserName,
                    SenderImage = temp.sender.ImagePath ?? "/content/images/avatar/default-avatar.jpg",
                    ReceiverId = temp.m.ReceiverId,
                    ReceiverName = receiver.UserName,
                    ReceiverImage = receiver.ImagePath ?? "/content/images/avatar/default-avatar.jpg",
                    Content = temp.m.Message,
                    Timestamp = temp.m.Timestamp.HasValue
                        ? temp.m.Timestamp.Value.ToString("yyyy-MM-dd HH:mm:ss")
                        : "" // Nếu null thì trả về chuỗi rỗng
                })
                .ToListAsync();
        }
        public async Task SaveMessageAsync(Syccchatmessage message)
        {
            _context.Syccchatmessages.Add(message);
            await _context.SaveChangesAsync();
        }
        public async Task<List<Sycuuser>> getallUsersAsync()
        {
            return await _context.Sycuusers
                .Where(u => u.IsActive==true)
                .Select(u => new Sycuuser
                {
                    UserName = u.UserName,
                    UserId = u.UserId,
                    ImagePath = u.ImagePath
                })
                .ToListAsync();
        }
    }
}
