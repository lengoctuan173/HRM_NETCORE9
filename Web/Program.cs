using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Model.Models;
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
// Đăng ký LocalizerService
builder.Services.AddSingleton<LocalizerService>();

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

app.UseAuthorization();

app.MapStaticAssets();//Cấu hình để ứng dụng có thể phục vụ các file tĩnh như ảnh, CSS, JavaScript.

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Login}/{action=Index}/{id?}")
    .WithStaticAssets();


app.Run();
