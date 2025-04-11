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
    public class ChatMessageRepository : IChatMessageRepository
    {
        private readonly HrmContext _context;
        public ChatMessageRepository(HrmContext context)
        {
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
                    FilePath = temp.m.FilePath,
                    Timestamp = temp.m.Timestamp.HasValue
                        ? temp.m.Timestamp.Value.ToString("yyyy-MM-dd HH:mm:ss")
                        : ""
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
                .Where(u => u.IsActive == true)
                .Select(u => new Sycuuser
                {
                    UserName = u.UserName,
                    UserId = u.UserId,
                    ImagePath = u.ImagePath
                })
                .ToListAsync();
        }

        // Triển khai các phương thức chat nhóm
        public async Task<List<Syccchatgroup>> GetUserGroupsAsync(string userId)
        {
            return await _context.Syccchatgroupmembers
                .Where(m => m.UserId == userId)
                .Join(_context.Syccchatgroups,
                    member => member.GroupChatId,
                    group => group.GroupChatId,
                    (member, group) => group)
                .ToListAsync();
        }

        public async Task<Syccchatgroup> CreateGroupAsync(string groupName, string creatorId, List<string> memberIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Tạo nhóm mới
                var group = new Syccchatgroup
                {
                    GroupChatName = groupName,
                };
                _context.Syccchatgroups.Add(group);
                await _context.SaveChangesAsync();

                // Thêm các thành viên vào nhóm
                var members = memberIds.Select(memberId => new Syccchatgroupmember
                {
                    GroupChatId = group.GroupChatId,
                    UserId = memberId,
                }).ToList();

                _context.Syccchatgroupmembers.AddRange(members);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
                return group;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<SyccchatmessageDto>> GetGroupMessagesAsync(string groupId)
        {
            return await _context.Syccchatmessages
                .Where(m => m.GroupChatId ==  long.Parse(groupId))
                .OrderBy(m => m.Timestamp)
                .Join(_context.Sycuusers,
                    m => m.SenderId,
                    u => u.UserId,
                    (m, sender) => new SyccchatmessageDto
                    {
                        MessageId = m.ChatId,
                        SenderId = m.SenderId,
                        SenderName = sender.UserName,
                        SenderImage = sender.ImagePath ?? "/content/images/avatar/default-avatar.jpg",
                        GroupChatId = m.GroupChatId,
                        Content = m.Message,
                        FilePath = m.FilePath,
                        Timestamp = m.Timestamp.HasValue
                            ? m.Timestamp.Value.ToString("yyyy-MM-dd HH:mm:ss")
                            : ""
                    })
                .ToListAsync();
        }

        public async Task SaveGroupMessageAsync(Syccchatmessage message)
        {
            _context.Syccchatmessages.Add(message);
            await _context.SaveChangesAsync();
        }

        //public async Task<List<SyccchatmessageDto>> GetGroupMembersAsync(string groupId)
        //{
        //    return await _context.Sycchatgroupmembers
        //        .Where(m => m.GroupChatId == groupId)
        //        .Join(_context.Sycuusers,
        //            m => m.UserId,
        //            u => u.UserId,
        //            (m, u) => new SyccchatmessageDto
        //            {
        //                UserId = u.UserId,
        //                UserName = u.UserName,
        //                UserImage = u.ImagePath ?? "/content/images/avatar/default-avatar.jpg",
        //                JoinDate = m.JoinDate
        //            })
        //        .ToListAsync();
        //}
    }
}
