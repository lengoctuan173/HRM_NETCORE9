using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class Syccchatmessage
{
    public long ChatId { get; set; }

    public string? SenderId { get; set; }

    public string? ReceiverId { get; set; }

    public string? Message { get; set; }

    public DateTime? Timestamp { get; set; }

    public long? GroupChatId { get; set; }

    public string? FilePath { get; set; }
}