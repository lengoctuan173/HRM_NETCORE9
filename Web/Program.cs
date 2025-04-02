using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System.Threading.RateLimiting;
using Business;
using Business.Implementations;
using Business.Interfaces;
using Data.Implementations;
using Data.Interfaces;
using HRM.Core.Implementations;
using HRM.Core.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Model.Models;
using Web.Hubs;
using Web.Resources;
var builder = WebApplication.CreateBuilder(args);
/// Cấu hình đa ngôn ngữ Localization
builder.Services.AddLocalization();
// Cấu hình để lấy ngôn ngữ từ request
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new List<CultureInfo> {
        new CultureInfo("en-US"),  // English (US)
        new CultureInfo("vi-VN"),  // Vietnamese
        new CultureInfo("ja-JP"),  // Japan
        new CultureInfo("ko-KR"),  // Korean
    };
    options.SetDefaultCulture("en-US");
    options.SupportedCultures = supportedCultures;
    options.SupportedUICultures = supportedCultures;
});
// Đọc SecretKey từ appsettings.json
var key = Encoding.UTF8.GetBytes(builder.Configuration["JwtSettings:SecretKey"]);
builder.Services.AddSignalR(); // Chat Hub
// Đăng ký dịch vụ Authentication cho ứng dụng
builder.Services.AddAuthentication(options =>
{
    // Thiết lập cơ chế xác thực mặc định là JWT
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;

    // Thiết lập cơ chế thử thách mặc định là JWT (khi không có quyền truy cập, sẽ yêu cầu xác thực bằng JWT)
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
// Cấu hình JwtBearer (JWT Authentication)
.AddJwtBearer(options =>
{
    // Không yêu cầu HTTPS để truyền token (chỉ nên dùng trong môi trường phát triển)
    options.RequireHttpsMetadata = false;

    // Lưu token vào HttpContext để có thể sử dụng trong ứng dụng
    options.SaveToken = true;

    // Thiết lập các quy tắc xác thực token
    options.TokenValidationParameters = new TokenValidationParameters
    {
        // Bật kiểm tra khóa bí mật để xác thực chữ ký của token
        ValidateIssuerSigningKey = true,

        // Cung cấp khóa bí mật dùng để xác thực JWT
        IssuerSigningKey = new SymmetricSecurityKey(key),

        // Kiểm tra người phát hành token (Issuer)
        ValidateIssuer = true,

        // Xác định người phát hành hợp lệ (đọc từ cấu hình)
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],

        // Kiểm tra người nhận token (Audience)
        ValidateAudience = true,

        // Xác định người nhận hợp lệ (đọc từ cấu hình)
        ValidAudience = builder.Configuration["JwtSettings:Audience"],

        // Kiểm tra thời gian sống của token
        ValidateLifetime = true,

        // Không cho phép thời gian lệch giữa client và server (mặc định là 5 phút)
        ClockSkew = TimeSpan.Zero
    };
    // Cấu hình đọc Token từ Cookie
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["JwtToken"];
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});
builder.Services.AddHttpContextAccessor(); // lấy thông tin user, session, request headers từ bất kỳ đâu trong ứng dụng.
// Đăng ký Authorization
builder.Services.AddAuthorization();
// Đăng ký LocalizerService language
builder.Services.AddSingleton<LocalizerService>();
// Dang ky JWT va Password
builder.Services.AddScoped<IJwtHelper, JwtHelper>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IChatMessageRepository, ChatMessageRepository>();
builder.Services.AddSingleton<IBackgroundQueueWorker, BackgroundQueueWorker>();
builder.Services.AddHostedService<QueueProcessingWorker>();
//// Đăng ký ICommonService duy nhất
builder.Services.AddScoped<ICommonService, CommonService>();
//// Tự động đăng ký tất cả Service có hậu tố "Service"
builder.Services.Scan(scan => scan
    .FromApplicationDependencies()
    .AddClasses(classes => classes.Where(type =>
        type.Name.EndsWith("Service") && type.GetInterfaces().Any(i => i.Name.EndsWith("Service"))
    ))
    .AsImplementedInterfaces()
    .WithScopedLifetime()
);
// Lấy Connection String từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
//// Đăng ký DbContext
builder.Services.AddDbContext<HrmContext>(options =>
    options.UseSqlServer(connectionString),
    ServiceLifetime.Scoped);
// Add services to the container.
builder.Services.AddControllersWithViews().AddViewLocalization() // Hỗ trợ dịch trong Views
    .AddDataAnnotationsLocalization(); // Hỗ trợ dịch Validation Message;

var app = builder.Build();
/// Cấu hình đa ngôn ngữ
// Sử dụng Localization
var locOptions = app.Services.GetRequiredService<IOptions<RequestLocalizationOptions>>();
 app.UseRequestLocalization(locOptions.Value);

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}
app.UseHttpsRedirection(); //Tự động chuyển hướng tất cả yêu cầu HTTP sang HTTPS để bảo mật hơn.
app.UseRouting(); //Bật hệ thống định tuyến của ASP.NET Core.
app.UseStaticFiles(); // Đảm bảo file tĩnh được phục vụ trước khi Middleware kiểm tra JWT
// Kích hoạt Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();
// Middleware kiểm tra JWT hết hạn và xóa cookie nếu cần
app.Use(async (context, next) =>
{
    var path = context.Request.Path.Value?.ToLower();
    var token = context.Request.Cookies["JwtToken"];
    var langCookie = context.Request.Cookies[".AspNetCore.Culture"];
    var logger = app.Services.GetRequiredService<ILogger<Program>>();
    logger.LogInformation($"Path: {path}, JwtToken: {token}, CultureCookie: {langCookie}");
    //// Bỏ qua Middleware nếu truy cập API hoặc SignalR (tránh lỗi vòng lặp)
    if (path.StartsWith("/api") || path.StartsWith("/chathub") || path.Contains("/language") || path.Contains("/content") || path.Contains("/css") || path.Contains("/js") || path.Contains("/scripts") || path.Contains("/images"))
    {
        await next();
        return;
    }
    if (!string.IsNullOrEmpty(token))
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtToken = tokenHandler.ReadToken(token) as JwtSecurityToken;

        if (jwtToken != null && jwtToken.ValidTo < DateTime.UtcNow)
        {
            // Token hết hạn => Xóa cookie
            context.Response.Cookies.Delete("JwtToken");

            // Nếu không phải đang login, redirect về trang Login
            if (!path.StartsWith("/login"))
            {
                context.Response.Redirect("/Login");
                return;
            }
        }
    }
    else if (!path.StartsWith("/login"))
    {
        // Không có token mà không phải đang ở Login => Redirect
        context.Response.Redirect("/Login");
        return;
    }

    await next();
});

#pragma warning disable ASP0014 // Suggest using top level route registrations
app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers(); // Cho phép Controller xử lý request
});
#pragma warning restore ASP0014 // Suggest using top level route registrations
app.MapStaticAssets();//Cấu hình để ứng dụng có thể phục vụ các file tĩnh như ảnh, CSS, JavaScript.

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}")
    .WithStaticAssets();

// Setting Chathub
app.MapHub<ChatHub>("/chatHub");
app.Run();
