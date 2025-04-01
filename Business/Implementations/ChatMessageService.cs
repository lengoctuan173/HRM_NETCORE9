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

        //public async Task<List<Syccchatmessage>> GetMessagesInGroupAsync(int groupId)
        //{
        //    return await _context.Syccchatmessages
        //        .Where(m => m.ChatId == groupId)
        //        .OrderBy(m => m.Timestamp)
        //        .ToListAsync();
        //}

    }
}
