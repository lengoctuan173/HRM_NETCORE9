using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Model.Models;
using Model.Models.DTOs;

namespace Business.Interfaces
{
    public interface IChatMessageService
    {
        Task<List<SyccchatmessageDto>> GetMessagesBetweenUsersAsync(string user1, string user2);
       // Task<List<Syccchatmessage>> GetMessagesInGroupAsync(int groupId);
        Task SaveMessageAsync(Syccchatmessage message);
        Task<List<Sycuuser>> getallUsersAsync();

        // Thêm các phương thức cho chat nhóm
        Task<List<Syccchatgroup>> GetUserGroupsAsync(string userId);
        Task<Syccchatgroup> CreateGroupAsync(string groupName, string creatorId, List<string> memberIds);
        Task<List<SyccchatmessageDto>> GetGroupMessagesAsync(string groupId);
        Task SaveGroupMessageAsync(Syccchatmessage message);
        //Task<List<Syccchatmessage>> GetGroupMembersAsync(string groupId);
    }
}
