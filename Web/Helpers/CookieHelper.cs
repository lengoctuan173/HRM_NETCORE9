namespace Web.Helper
{
    public static class CookieHelper
    {
        private const string TokenKey = "JwtToken"; // Tên Cookie lưu Token
        // Lưu Token vào Cookie
        public static void SetToken(HttpResponse response, string token, bool isHttps)
        {
            response.Cookies.Append(TokenKey, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = isHttps, // Chỉ dùng trên HTTPS = true
                Expires = DateTime.UtcNow.AddHours(2)
            });
        }

        // Đọc Token từ Cookie
        public static string GetToken(HttpRequest request)
        {
            request.Cookies.TryGetValue(TokenKey, out var token);
            return token;
        }

        // Xóa Token khỏi Cookie (đăng xuất)
        public static void RemoveToken(HttpResponse response)
        {
            response.Cookies.Delete(TokenKey);
        }
    }
}
