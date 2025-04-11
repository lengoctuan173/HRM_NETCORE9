using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class Syccchatgroupmember
{
    public long GroupChatMemberId { get; set; }

    public long? GroupChatId { get; set; }

    public string? UserId { get; set; }
}
