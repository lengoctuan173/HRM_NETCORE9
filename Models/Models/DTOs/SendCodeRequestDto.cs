using System;
using System.Collections.Generic;

namespace Model.Models;

public partial class SendCodeRequestDto
{
    public string? Email { get; set; }
    public string? Mobile { get; set; }
    public string? Otp { get; set; }
  
}
