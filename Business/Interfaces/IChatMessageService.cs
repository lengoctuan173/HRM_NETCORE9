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
    }
}
