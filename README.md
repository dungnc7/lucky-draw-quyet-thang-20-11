# Chương Trình Quay Thưởng 20/11/2026 — Quyết Thắng

Website quay thưởng dành cho chương trình Ngày Nhà giáo Việt Nam 20/11/2026 của Trung tâm Giáo dục Nghề nghiệp Quyết Thắng.

**Demo / website:** Sau khi kích hoạt GitHub Pages, truy cập `https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/`.

## Tính năng

- Nhập Excel/CSV qua chọn file hoặc kéo thả, ưu tiên **mã nhân viên** thay vì CCCD.
- 5 hạng giải, tổng 44 suất, quay **15 giây/hạng** (mặc định).
- Chỉnh giá trị tiền thưởng trước khi quay; không cho một nhân viên trúng hai giải.
- Giao diện sân khấu 20/11, logo Quyết Thắng, tiếng đếm ngược và nhạc nền bật/tắt được.
- Xuất Excel kết quả và nhật ký quay cho người vận hành.

## Chạy thử

Mở `index.html` trên Chrome/Edge hoặc dùng GitHub Pages. Nhấn **Nạp dữ liệu demo** để kiểm tra. Có thể chạy offline; không cần backend.

## Cài GitHub Pages

Vào repository → **Settings → Pages** → **Build and deployment** → **Deploy from a branch** → chọn `main` và `/(root)` → **Save**.

Đường dẫn website mặc định: `https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/` (chỉ hoạt động sau khi GitHub Pages báo đã xuất bản).

## Dữ liệu và quyền riêng tư

- **Không commit hoặc tải lên GitHub danh sách nhân viên thật**, CCCD, bảng kết quả hoặc nhật ký quay. Repository và website là công khai.
- File Excel được đọc trong **trình duyệt người vận hành**, không gửi lên máy chủ; tính năng quay và xuất file chạy client-side. Dữ liệu có thể được giữ tạm trong `sessionStorage` của tab đang sử dụng.
- Mỗi trình duyệt có một phiên quay **độc lập**; không đồng bộ danh sách và kết quả giữa các thiết bị.
- Hãy lưu bản kết quả Excel sau sự kiện. Đây là website quay thưởng client-side, không phải hệ thống kiểm toán có bảo đảm chống sửa đổi tuyệt đối.

## Bản quyền

Logo thuộc đơn vị sở hữu tương ứng. JSZip được sử dụng theo giấy phép trong [`LICENSE-JSZIP.txt`](./LICENSE-JSZIP.txt).
