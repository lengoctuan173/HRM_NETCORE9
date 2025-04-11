using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Intrinsics.X86;
using System.Text;
using System.Threading.Tasks;
using Business.Interfaces;
using Data.Interfaces;
using Model.Models;
using Model.Models.DTOs;

namespace Business.Implementations
{
    public class ChatMessageService: IChatMessageService
    {
        private readonly HrmContext _context;
        private readonly IChatMessageRepository _chatMessageRepository;

        public ChatMessageService(HrmContext context, IChatMessageRepository chatMessageRepository)
        {
            _context = context;
            _chatMessageRepository = chatMessageRepository;
        }
        public async Task<List<SyccchatmessageDto>> GetMessagesBetweenUsersAsync(string user1, string user2)
        {
            return await _chatMessageRepository.GetMessagesBetweenUsersAsync(user1, user2);
        }
        public async Task SaveMessageAsync(Syccchatmessage message)
        {
            await _chatMessageRepository.SaveMessageAsync(message);
        }
        public async Task<List<Sycuuser>> getallUsersAsync()
        {
            return await _chatMessageRepository.getallUsersAsync();
        }

        // Triển khai các phương thức chat nhóm
        public async Task<List<Syccchatgroup>> GetUserGroupsAsync(string userId)
        {
            return await _chatMessageRepository.GetUserGroupsAsync(userId);
        }

        public async Task<Syccchatgroup> CreateGroupAsync(string groupName, string creatorId, List<string> memberIds)
        {
            return await _chatMessageRepository.CreateGroupAsync(groupName, creatorId, memberIds);
        }

        public async Task<List<SyccchatmessageDto>> GetGroupMessagesAsync(string groupId)
        {
            return await _chatMessageRepository.GetGroupMessagesAsync(groupId);
        }

        public async Task SaveGroupMessageAsync(Syccchatmessage message)
        {
            await _chatMessageRepository.SaveGroupMessageAsync(message);
        }

        //public async Task<List<Syccchatmessage>> GetGroupMembersAsync(string groupId)
        //{
        //    return await _chatMessageRepository.GetGroupMembersAsync(groupId);
        //}

    }
}
