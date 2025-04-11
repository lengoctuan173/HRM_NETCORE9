using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Model.Models.DTOs
{
    public class SyccchatmessageDto
    {
        public long MessageId { get; set; }
        public string SenderId { get; set; }
        public string SenderName { get; set; }
        public string SenderImage { get; set; }
        public string ReceiverId { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverImage { get; set; }
        public string Content { get; set; }
        public string Timestamp { get; set; }
        public string FilePath { get; set; }
        public long? GroupChatId { get; set; }
    }
}
