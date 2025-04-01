using Microsoft.Extensions.DependencyInjection;

namespace Business
{
    public class CommonService: ICommonService
    {
        private readonly IServiceProvider _serviceProvider;

        public CommonService(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider; // Lưu lại service provider
        }

        // Phương thức lấy một service bất kỳ đã được đăng ký
        public T GetService<T>() where T : class
        {
            return _serviceProvider.GetRequiredService<T>();
        }
    }
}
