using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Model.Models;
using Model.Models.DTOs;

namespace Data.Interfaces
{
    public interface IChatMessageRepository
    {
        Task<List<SyccchatmessageDto>> GetMessagesBetweenUsersAsync(string user1, string user2);
        Task SaveMessageAsync(Syccchatmessage message);
        Task<List<Sycuuser>> getallUsersAsync();

        Task<List<Syccchatgroup>> GetUserGroupsAsync(string userId);
        Task<Syccchatgroup> CreateGroupAsync(string groupName, string creatorId, List<string> memberIds);
        Task<List<SyccchatmessageDto>> GetGroupMessagesAsync(string groupId);
        Task SaveGroupMessageAsync(Syccchatmessage message);
       // Task<List<UserDto>> GetGroupMembersAsync(string groupId);
    }
}
