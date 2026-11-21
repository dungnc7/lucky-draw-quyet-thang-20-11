# Lucky Draw Event Platform v2.6

Nền tảng quay thưởng cho Ngày Nhà giáo Việt Nam 20/11, Year End Party và chương trình tùy chỉnh — Trung tâm Giáo dục Nghề nghiệp Quyết Thắng.

Website: [dungnc7.github.io/lucky-draw-quyet-thang-20-11](https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/)

## Cơ cấu giải động và Excel trao thưởng — PR chờ duyệt

Admin có thể thêm/xóa/sắp xếp hạng giải, sửa số suất, số người mỗi lượt, thời gian, tên và tiền mỗi giải trong **Cài đặt chương trình**. Bản 20/11 mặc định vẫn là 44 người, 13 lượt, 10 giây/lượt; đây là mẫu có thể sửa. Lượt cuối tự lấy số người còn lại; từng lượt vẫn cần chuẩn bị và bắt đầu bằng tay. Giao diện hiển thị số người và tiến độ, không hiển thị tổng tiền.

**Xuất danh sách trao thưởng** trong Kết quả tạo hai sheet có trạng thái trao thưởng, chỗ ký nhận, lọc và thiết lập in A4 ngang. Chỉ xuất người trúng đã xác nhận, loại kết quả demo và CCCD. Giữ nút xuất Excel chi tiết và nhật ký; file không tải lên Firebase/GitHub.

Xem [thiết kế, giới hạn, migration và kiểm thử](docs/DYNAMIC_PRIZES.md). Nhánh này dựa trên PR Authentication #3 đang mở; **chưa merge hoặc deploy**. Quyền đọc vẫn yêu cầu tài khoản Admin/Operator đã được cấp quyền.

## Đăng nhập và phân quyền (PR chờ duyệt)

Login bắt buộc trước khi mở Dashboard. Firebase khôi phục phiên, xác minh quyền Admin/Nhân viên vận hành từ máy chủ; tài khoản chưa được cấp quyền bị chặn. Có Ghi nhớ đăng nhập, hiện/ẩn mật khẩu, Quên mật khẩu và menu Đăng xuất. Admin được lưu cài đặt chung; Operator chỉ xem cấu hình và vận hành quay/import/export. Không có đăng ký công khai hoặc tự cấp quyền.

Phiên quay và bản sửa trên máy được tách theo UID. Đăng xuất giữ bản đã lưu để chính tài khoản đó khôi phục; tài khoản khác không tự nhìn thấy phiên trước. Phiên cũ chưa gắn UID được giữ nguyên nhưng cần chủ phiên kiểm tra trước khi nâng cấp. Không deploy giữa một phiên thật chưa xử lý việc này.

Xem [kiến trúc/quyền và thứ tự release](docs/AUTH_ACCESS.md), [bằng chứng kiểm thử và giới hạn](docs/QA_AUTH.md). **Chưa merge/deploy bản Authentication này.** Website hiện tại vẫn là bản cài đặt chung trước nâng cấp login.

## Cài đặt chương trình

Thông tin · Giao diện · Giải thưởng · Âm thanh trong một bảng Admin. Xem trước bản sửa, rồi **Lưu & áp dụng cho tất cả thiết bị** bằng tài khoản Admin. Trong bản Auth candidate, chỉ tài khoản được cấp quyền mới xem được cấu hình. Firebase `sharedEvent/live` đồng bộ toàn bộ cấu hình công khai; revision transaction ngăn ghi đè bản mới. Cơ cấu giải là cấu hình động; phiên bắt đầu sẽ khóa toàn bộ cơ cấu, tên và tiền giải thực tế trong snapshot riêng.

Giữ 7 theme, mặc định **Sắc Màu Quyết Thắng**. Dữ liệu nhân viên, CCCD, kết quả và phiên quay luôn ở riêng trên máy. Cấu hình phiên đang quay được khóa; cập nhật theme không ngắt đồng hồ. Excel nhập/xuất và audit giữ nguyên.

Xem [hướng dẫn kiến trúc, chuyển đổi và kiểm thử](docs/SIMPLIFIED_SETTINGS.md). JSON publication và theme-only là luồng lịch sử đã được thay bằng cài đặt chung. Bản Authentication trên nhánh này vẫn cần duyệt PR trước khi release.

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

1. Mở online và đăng nhập tài khoản được cấp quyền. Admin xem trước/lưu cài đặt; Operator vận hành phiên. Không dùng cache để bỏ qua xác minh quyền. Mất kết nối sẽ khóa giao diện và giữ snapshot để khôi phục sau khi xác minh lại.
2. Chọn hoặc kéo thả Excel `.xlsx`/`.xlsm` hoặc CSV, ít nhất 44 nhân viên hợp lệ. Ưu tiên cột **Mã nhân viên**, **Họ tên**; **Phòng ban** và **Số CCCD** tùy chọn. Không chạy macro/formula. `.xls` cũ cần lưu lại thành `.xlsx`.
3. Review invalid/duplicate import rows. Admins can edit prize names and amounts in the settings section. Fixed allocation and duration stay unchanged. Active sessions retain their frozen amounts until an explicit new session.
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
npm test
python3 -m unittest discover -s tests -p 'test_publication.py'
python3 -m http.server 8765 --bind 127.0.0.1
```

Python 3 và Node.js 20+ chỉ cần cho kiểm tra phát triển. Xem [kiến trúc](docs/ARCHITECTURE.md), [QA v2.6](docs/QA_V2_6.md) và [triển khai](PUBLISH.md).

Logo được giữ nguyên từ bộ nguồn do chủ dự án cung cấp; không thêm hình ảnh, font hoặc nhạc bên ngoài. JSZip 3.10.1 giữ nguyên, giấy phép tại LICENSE-JSZIP.txt. Họa tiết sách và hiệu ứng mới được tạo bằng SVG/CSS, âm nền được tổng hợp bằng Web Audio.

Yêu cầu v2.6 và phạm vi được duyệt: [Master Prompt](docs/MASTER_PROMPT_V2_6.md).
