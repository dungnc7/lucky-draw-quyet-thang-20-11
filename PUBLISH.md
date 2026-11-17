# Hướng dẫn triển khai công khai lên GitHub Pages

1. Đăng nhập tài khoản GitHub `dungnc7` tại https://github.com/new .
2. Tạo repository `lucky-draw-quyet-thang-20-11`, chọn **Public**, nhấn **Create repository**.
3. Trong repo mới, chọn **Add file → Upload files**, kéo toàn bộ file trong thư mục này vào (quan trọng nhất là `index.html`), nhấn **Commit changes**. Hoặc dùng `git` từ terminal.
4. Vào **Settings → Pages**, ở **Build and deployment** chọn **Deploy from a branch**, **main**, **/(root)** rồi **Save**.
5. Khi workflow Pages hoàn tất, mở `https://dungnc7.github.io/lucky-draw-quyet-thang-20-11/`.

Nếu muốn dùng Git CLI sau khi đã tạo repository rỗng:

```bash
git init
git add .
git commit -m "Deploy Lucky Draw 20-11 v2.3"
git branch -M main
git remote add origin https://github.com/dungnc7/lucky-draw-quyet-thang-20-11.git
git push -u origin main
```

**Không đưa file nhân viên thật hoặc kết quả quay lên GitHub.**
