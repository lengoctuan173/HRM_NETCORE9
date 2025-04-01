using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class Syccchatgroupmember
{
    public long ChatGroupMemberId { get; set; }

    public long? ChatGroupId { get; set; }

    public string? UserId { get; set; }
}
