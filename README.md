# Lucky Draw Event Platform v2.6

Nền tảng quay thưởng cho Ngày Nhà giáo Việt Nam 20/11, Year End Party và chương trình tùy chỉnh — Trung tâm Giáo dục Nghề nghiệp Quyết Thắng.

Website: [dungnc7.github.io/lucky-draw-quyet-thang-20-11](https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/)

## Sự kiện và giao diện

**Sắc Màu Quyết Thắng** (`quyet-thang-corporate`) là mặc định cho cả 3 mẫu sự kiện. Màu thương hiệu: xanh `#2E7BC3`, đỏ `#F2363F`, navy `#0D1B3D`; logo gốc được giữ nguyên.

- **Mẫu cho sự kiện mới** + **Tạo sự kiện từ mẫu** tạo một sự kiện độc lập với `appearance.themeId = 'quyet-thang-corporate'`.
- **Sự kiện đã lưu** chuyển giữa các sự kiện. **Nội dung sự kiện hiện tại** đổi mẫu nội dung của sự kiện đang mở, giữ theme đã chọn. Không tạo/chuyển sự kiện trong lúc đang quay.
- **Giao diện** có 7 lựa chọn: Sắc Màu Quyết Thắng, Sen Vàng Đỏ Ngọc (`lotus`), Đêm Vàng Sang Trọng, Ngọc Lục Bảo, Tím Hoàng Gia, Đại Dương Xanh, Đỏ Rực Rỡ. Nhãn “Mặc định” luôn thuộc corporate; lựa chọn hiện tại có thể là theme khác.
- Theme được lưu riêng cho từng sự kiện, kể cả khi chưa nhập danh sách. Một theme hợp lệ đã lưu, bao gồm `lotus`, được giữ sau reload. Thiếu/sai theme ID thì dùng corporate; không ghi đè các trường khác.
- Theme không chứa câu chữ của sự kiện. Year End Party không dùng nội dung 20/11; thay theme không thay nội dung, tiền giải, người trúng, đồng hồ hoặc âm thanh.

Danh mục sự kiện chỉ chứa nội dung/giao diện, lưu ở `localStorage` của trình duyệt (dùng `sessionStorage` nếu môi trường không cho truy cập localStorage). Danh sách nhân viên, lượt đang quay, kết quả và tiền giải được lưu riêng theo sự kiện trong `sessionStorage` của tab. Không đồng bộ qua máy chủ hoặc thiết bị. Nếu danh mục đổi ở tab khác, ứng dụng yêu cầu tải lại thay vì ghi đè dữ liệu của tab đó.

Vì nguồn gốc chỉ có v2.4 chưa có theme/preset, chủ dự án đã cho phép bổ sung lớp sự kiện và tạo bộ 7 theme mới vào ngày 18/11/2026. Không tuyên bố đã có hoặc giữ nguyên một bộ theme v2.6 cũ.

## Cấu hình

| Hạng giải | Tổng người | Người/lượt | Số lượt | Thời gian/lượt |
|---|---:|---:|---:|---:|
| Khuyến khích | 30 | 6 | 5 | 10 giây |
| Tư | 8 | 4 | 2 | 10 giây |
| Ba | 3 | 1 | 3 | 10 giây |
| Nhì | 2 | 1 | 2 | 10 giây |
| Nhất | 1 | 1 | 1 | 10 giây |

Tổng 44 người khác nhau, 13 lượt, 130 giây đếm ngược; thời gian MC chuẩn bị giữa các lượt không tính vào tổng này. Trình duyệt công bố ở lần xử lý timer đầu tiên tại/sau mốc 10.000 ms; không thể bảo đảm độ chính xác thời gian thực của hệ điều hành.

## Vận hành

1. Mở website hoặc tải `index.html` và mở bằng Chrome/Edge để dùng offline. Không cần build, CDN, backend hay cài package.
2. Chọn hoặc kéo thả Excel `.xlsx`/`.xlsm` hoặc CSV, ít nhất 44 nhân viên hợp lệ. Ưu tiên cột **Mã nhân viên**, **Họ tên**; **Phòng ban** và **Số CCCD** tùy chọn. Không chạy macro/formula. `.xls` cũ cần lưu lại thành `.xlsx`.
3. Kiểm tra báo cáo loại dòng sai/trùng và chỉnh số tiền từng giải. Trường tiền khóa ngay khi bắt đầu lượt đầu; chỉ phiên mới cho phép sửa lại.
4. Dùng **Chế độ sân khấu** để ẩn quản trị và yêu cầu fullscreen khi trình duyệt hỗ trợ. Có thể dùng fullscreen của trình duyệt nếu yêu cầu này bị từ chối. Màn hình 16:9 1366×768 và 1920×1080 đã kiểm tra bố cục.
5. Bật/tắt nhạc và âm đếm giây độc lập. Âm tổng hợp có sẵn, không tải nhạc từ mạng; file nhạc riêng do người vận hành chọn cần có quyền sử dụng. Trình duyệt cần tương tác người dùng để phát âm.
6. Nhấn **Bắt đầu quay** cho từng lượt. Kết quả giữ trên màn hình công bố. **Chuẩn bị lượt tiếp theo** chỉ chuyển sang sẵn sàng; nhấn bắt đầu lần nữa mới quay. Không tự chạy lượt kế tiếp.
7. Xuất Excel kết quả và nhật ký JSON; mỗi dòng có lượt trong hạng, lượt toàn chương trình và số tiền giải. Lưu file an toàn sau sự kiện.

## Lưu phiên và nâng cấp

Người được chọn, thời điểm kết thúc, tiền giải và trạng thái được ghi vào `sessionStorage` trước khi chạy đếm ngược. Refresh khôi phục đúng người đã chọn; lượt hết thời gian được công bố một lần. Khi không ghi được bộ nhớ, lượt mới không bắt đầu. Khi không ghi được kết quả, giữ tab và tải lại để khôi phục lượt đã lưu; không nạp danh sách mới để quay lại.

Mỗi tab/trình duyệt là phiên **độc lập**, không có đồng bộ thiết bị. Danh mục nội dung/theme có thể giữ qua lần mở trình duyệt; dữ liệu quay trong tab có thể mất khi đóng tab, dùng chế độ riêng tư hoặc xóa bộ nhớ. Không đổi máy, đóng tab hay chỉnh đồng hồ hệ thống giữa lượt. Đây không phải hệ thống kiểm toán chống sửa đổi hoặc biên bản ký số.

Phiên v2.3 có cấu hình khác nên không được tự chuyển sang v2.4. Nếu phát hiện phiên cũ, ứng dụng khóa bắt đầu và cung cấp **Xuất phiên v2.3** để tải bản JSON lưu trữ cũ. Kiểm tra/lưu bản này trước khi chủ động xóa phiên. Không trộn kết quả hai phiên bản.

Cấu hình khuyến khích hiện tại là **5 lượt × 6 người** (Lượt 1/5 đến 5/5), bố cục 3 cột × 2 hàng trên màn hình lớn và 2 cột trên điện thoại. Sau lượt 5/5, nút **Chuẩn bị quay Giải tư** chỉ chuẩn bị; quản trị viên phải nhấn bắt đầu riêng. Phiên v2.4 lưu trước lần cập nhật cấu hình này được khóa tiếp tục và có nút **Xuất phiên cấu hình cũ**. Hãy lưu bản sao trước khi chủ động xóa phiên để bắt đầu cấu hình mới.

## Quyền riêng tư

Repository và website công khai. **Không commit danh sách nhân viên thật, CCCD, kết quả hay nhật ký.** File được xử lý trong trình duyệt, không tải lên máy chủ. Màn hình công bố chỉ hiện mã và tên. Với dòng chỉ có CCCD, mã trình chiếu `NV-00001` dựa trên vị trí nhập, không chứa chữ số CCCD; Excel riêng của người vận hành vẫn có cột CCCD nếu đã nhập.

Chế độ demo tạo tên/mã giả lập và CCCD trống. Chỉ dùng demo/fixture giả lập để kiểm thử; xóa phiên demo trước sự kiện.

## Kiểm tra phát hành

```sh
python3 scripts/preflight.py
node --test tests/test-v24.cjs
python3 -m http.server 8765 --bind 127.0.0.1
```

Python 3 và Node.js 20+ chỉ cần cho kiểm tra phát triển. Xem [kiến trúc](docs/ARCHITECTURE.md), [QA v2.6](docs/QA_V2_6.md) và [triển khai](PUBLISH.md).

Logo được giữ nguyên từ bộ nguồn do chủ dự án cung cấp; không thêm hình ảnh, font hoặc nhạc bên ngoài. JSZip 3.10.1 giữ nguyên, giấy phép tại LICENSE-JSZIP.txt. Họa tiết sách và hiệu ứng mới được tạo bằng SVG/CSS, âm nền được tổng hợp bằng Web Audio.

Yêu cầu v2.6 và phạm vi được duyệt: [Master Prompt](docs/MASTER_PROMPT_V2_6.md).
