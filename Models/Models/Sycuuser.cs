using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class Sycuuser
{
    public string UserId { get; set; } = null!;

    public string UserName { get; set; } = null!;

    public string? Password { get; set; }

    public string? StaffId { get; set; }

    public string? UserEmail { get; set; }

    public string? IpRestriction { get; set; }

    public string? StartId { get; set; }

    public string? EndId { get; set; }

    public bool? IsActive { get; set; }

    public string? Mobile { get; set; }

    public string? GroupId { get; set; }

    public string? Deptcode { get; set; }

    public string? CreateUid { get; set; }

    public DateTime? CreateDt { get; set; }

    public string? UpdateUid { get; set; }

    public DateTime? UpdateDt { get; set; }

    public string? ImagePath { get; set; }
}
