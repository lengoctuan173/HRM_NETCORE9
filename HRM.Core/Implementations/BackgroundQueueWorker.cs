using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using HRM.Core.Interfaces;

namespace HRM.Core.Implementations
{
    public class BackgroundQueueWorker: IBackgroundQueueWorker
    {
        private readonly ConcurrentQueue<Func<IServiceProvider, CancellationToken, Task>> _workItems = new();
        private readonly SemaphoreSlim _signal = new(0);
        private readonly IServiceProvider _serviceProvider;

        public BackgroundQueueWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }
        //Hàm Enqueue() – Đưa công việc vào hàng đợi
        public void Enqueue(Func<IServiceProvider, CancellationToken, Task> workItem)
        {
            // Kiểm tra xem workItem có null không, nếu null thì ném ra ngoại lệ
            if (workItem == null) throw new ArgumentNullException(nameof(workItem));
            // Thêm công việc vào hàng đợi
            _workItems.Enqueue(workItem);
            // Tăng semaphore để báo hiệu rằng có công việc mới trong hàng đợi
            _signal.Release();
        }
        //Hàm DequeueAsync() – Lấy công việc từ hàng đợi
        public async Task<Func<IServiceProvider, CancellationToken, Task>> DequeueAsync(CancellationToken cancellationToken)
        {
            // Nếu hàng đợi trống, WaitAsync(cancellationToken) sẽ chờ đến khi có công việc mới được thêm vào
            await _signal.WaitAsync(cancellationToken); // Chờ có công việc
            _workItems.TryDequeue(out var workItem); // Thử lấy công việc đầu tiên ra khỏi hàng đợi
                                                     // Nếu workItem null, ném ngoại lệ để báo lỗi, ngược lại, trả về công việc lấy được
            return workItem ?? throw new InvalidOperationException("Không có công việc nào trong hàng đợi.");
        }
    }
}
