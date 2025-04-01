using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HRM.Core.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace HRM.Core.Implementations
{
    public class QueueProcessingWorker: BackgroundService
    {
        private readonly IBackgroundQueueWorker _queueService;
        private readonly IServiceProvider _serviceProvider;

        public QueueProcessingWorker(IBackgroundQueueWorker queueService, IServiceProvider serviceProvider)
        {
            _queueService = queueService;
            _serviceProvider = serviceProvider;
        }
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                //Lấy một công việc từ hàng đợi (BackgroundQueueWorker) để xử lý.
                var workItem = await _queueService.DequeueAsync(stoppingToken);

                if (workItem != null)
                {
                    using (var scope = _serviceProvider.CreateScope()) // Tạo scope mới cho mỗi công việc
                    {
                        try
                        {
                            //Xử lý công việc: Gọi workItem(scope.ServiceProvider, stoppingToken) để thực thi tác vụ
                            await workItem(scope.ServiceProvider, stoppingToken);
                            Console.WriteLine("Công việc đã được xử lý.");
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Lỗi khi xử lý công việc trong hàng đợi: {ex.Message}");
                        }
                    }
                }
            }
        }
    }
}
