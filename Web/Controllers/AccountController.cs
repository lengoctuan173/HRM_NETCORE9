using Business;
using HRM.Core.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Model.Models;
using Data.Interfaces;
using Business.Interfaces;
using System.Security.Claims;
using Model.Models.DTOs;

namespace Web.Controllers
{
    [Authorize]
    public class AccountController : Controller
    {
        private readonly IPasswordHasher _passwordHasher;
        private readonly IAccountService _accountService;
        private readonly ICommonService _commonService;
        
        public AccountController(ICommonService commonService, IPasswordHasher passwordHasher) {
            _passwordHasher = passwordHasher;
            _accountService = commonService.GetService<IAccountService>();
            _commonService = commonService;
        }
        
        public async Task<IActionResult> Index()
        {
            var userId = User.Identity?.Name;
            if (string.IsNullOrEmpty(userId))
            {
                return RedirectToAction("Index", "Login");
            }
            // Get user data from repository
          
            var user = await _accountService.GetUserByUserIdAsync(userId);
            
            if (user == null)
            {
                return RedirectToAction("Index", "Login");
            }
            
            return View(user);
        }
        
        [HttpPost]
        public async Task<IActionResult> ChangePassword(ChangePasswordViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View("Index");
            }
            
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userRepository = _commonService.GetService<IAuthRepository>();
            var user = await userRepository.GetUserByUserIdAsync(userId);
            
            // Verify current password
            if (!_passwordHasher.VerifyPassword(user.Password, model.CurrentPassword))
            {
                ModelState.AddModelError("CurrentPassword", "Current password is incorrect");
                return View("Index", user);
            }
            
            // Verify new passwords match
            if (model.NewPassword != model.ConfirmPassword)
            {
                ModelState.AddModelError("ConfirmPassword", "New password and confirmation do not match");
                return View("Index", user);
            }
            
            // Update password in database
            user.Password = _passwordHasher.HashPassword(model.NewPassword);
            await userRepository.UpdateUserAsync(user);
            
            TempData["SuccessMessage"] = "Password changed successfully";
            return RedirectToAction("Index");
        }
    }
    
    public class ChangePasswordViewModel
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }
    }
}
