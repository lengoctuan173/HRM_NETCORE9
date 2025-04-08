using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Resources;
namespace Model.Models.DTOs
{
    public class SycuuserDto
    {
        [Required(ErrorMessageResourceType = typeof(HRMResources), ErrorMessageResourceName = "Login_Err")]
        public string UserId { get; set; } = null!;

        [Required(ErrorMessageResourceType = typeof(HRMResources), ErrorMessageResourceName = "Login_Err")]
        public string UserName { get; set; } = null!;

        [Required(ErrorMessage = "Vui lòng nhập mật khẩu.")]
        public string? Password { get; set; }
    }
}
