using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class Sycuuserauth
{
    public long UserAuthId { get; set; }

    public string? UserId { get; set; }

    public int? Provider { get; set; }

    public string? ProviderKey { get; set; }

    public string? PasswordHash { get; set; }

    public string? ProviderImage { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? CreateDt { get; set; }
}
