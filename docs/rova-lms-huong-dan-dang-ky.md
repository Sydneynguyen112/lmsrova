# Hướng dẫn Đăng ký & Đăng nhập — LMS ROVA

**Phiên bản**: 1.0
**Đối tượng**: Học viên mới
**URL**: https://lmsrova.vercel.app

---

## Tổng quan 4 bước

```
1. Đăng ký tài khoản   →  /register
2. Xác nhận email      →  hộp thư của bạn
3. Đăng nhập           →  /sign-in
4. Chờ ROVA duyệt      →  gửi email cho mentor → bấm "Kiểm tra lại"
```

Sau khi ROVA duyệt, bạn mới thấy: **video onboarding → bài test đầu vào → khoá học**.

> Ảnh minh hoạ đặt trong `docs/images/`. Nếu chưa có, tạo thư mục và copy 4 ảnh chụp màn hình vào đúng tên file bên dưới.

---

## Bước 1 — Đăng ký tài khoản

![Màn hình đăng ký](images/rova-01-dang-ky.png)

1. Vào **https://lmsrova.vercel.app/register** (hoặc bấm *Đăng ký miễn phí* ở trang đăng nhập)
2. Điền đủ 4 ô:

| Ô | Yêu cầu |
|---|---|
| **Họ và tên** | Tên thật, viết có dấu — ROVA dùng tên này khi duyệt và khi mentor liên hệ |
| **Email** | Email thật, còn dùng được. **Đây là ID tài khoản của bạn** — dùng để đăng nhập và để ROVA duyệt |
| **Số điện thoại** | Số Zalo đang dùng, để mentor liên hệ |
| **Mật khẩu** | **Tối thiểu 8 ký tự**. Bấm icon con mắt để xem lại mật khẩu vừa gõ |

3. Tick ô **"Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật"** — không tick thì nút Đăng ký không chạy
4. Bấm **Đăng ký**

**Hoặc**: bấm **Đăng ký bằng Google** — nhanh hơn, không cần nhớ mật khẩu. Chọn Google thì bỏ qua luôn Bước 2.

---

## Bước 2 — Xác nhận email

![Đăng ký thành công](images/rova-02-dang-ky-thanh-cong.png)

Đăng ký xong bạn sẽ thấy dòng chữ vàng:

> **Đã tạo tài khoản. Kiểm tra email để xác nhận, sau đó đăng nhập.**

Việc cần làm:

1. Mở hộp thư của email vừa đăng ký
2. Tìm mail xác nhận (nếu không thấy → xem **Thư rác / Spam / Quảng cáo**)
3. Bấm link xác nhận trong mail
4. Quay lại `https://lmsrova.vercel.app/sign-in`

> **Chưa xác nhận email thì chưa đăng nhập được.** Đây là bước hay bị bỏ sót nhất.

---

## Bước 3 — Đăng nhập

![Màn hình đăng nhập](images/rova-03-dang-nhap.png)

1. Vào **https://lmsrova.vercel.app/sign-in**
2. Nhập **Email** + **Mật khẩu** đã đăng ký
3. Bấm **Đăng nhập**

**Quên mật khẩu?**
Nhập **email vào ô Email trước**, rồi mới bấm *Quên mật khẩu?*. Hệ thống gửi link đặt lại mật khẩu về hộp thư. Không nhập email trước sẽ báo: *"Nhập email trước rồi bấm Quên mật khẩu"*.

---

## Bước 4 — Chờ ROVA duyệt tài khoản

![Chờ duyệt](images/rova-04-cho-duyet.png)

Đăng nhập lần đầu, bạn sẽ gặp bảng:

> **Tài khoản đang chờ ROVA duyệt**
> Tài khoản đã tạo xong. ROVA cần duyệt tay thì video onboarding, bài test đầu vào và khoá học mới mở.

**Đây không phải lỗi.** Mọi tài khoản mới đều dừng ở đây cho tới khi ROVA gán khoá học.

### Việc bạn cần làm

1. Bấm nút **Chép** để copy email hiển thị trong khung
2. Gửi email đó qua **Zalo / Messenger** cho **mentor hoặc bạn tư vấn** đang hỗ trợ bạn
3. Chờ ROVA duyệt
4. Duyệt xong → bấm **Kiểm tra lại** là vào học được ngay (không cần đăng nhập lại)

Nút **Đăng xuất** dùng khi bạn muốn thoát ra và quay lại sau.

> Email gửi cho mentor phải **đúng email đã đăng ký**. Gửi nhầm email khác thì ROVA duyệt nhầm tài khoản, bạn vẫn bị kẹt ở màn hình này.

---

## Sau khi được duyệt

Vào lại app, thứ tự mở khoá:

1. **Video onboarding** — xem hết để mở bước sau
2. **Bài test đầu vào** — trả lời trung thực, kết quả dùng để xếp lộ trình học
3. **Dashboard + khoá học** — bắt đầu học

---

## Xử lý lỗi thường gặp

| Thông báo | Nguyên nhân | Cách xử lý |
|---|---|---|
| **Email không hợp lệ** | Email sai định dạng, thừa dấu cách, hoặc bị hệ thống mail chặn | Kiểm tra lại chính tả, xoá dấu cách đầu/cuối. Vẫn lỗi → dùng email Gmail khác hoặc đăng ký bằng Google |
| **Email đã tồn tại. Hãy đăng nhập.** | Bạn đã đăng ký email này rồi | Sang trang **Đăng nhập**. Quên mật khẩu → dùng *Quên mật khẩu?* |
| **Mật khẩu chưa đủ mạnh — tối thiểu 8 ký tự** | Mật khẩu quá ngắn | Đặt lại ≥ 8 ký tự, nên có chữ hoa + số |
| **Email hoặc mật khẩu không đúng** | Gõ sai, hoặc **chưa bấm link xác nhận email** | Bấm icon con mắt kiểm tra mật khẩu. Kiểm tra hộp thư xem đã xác nhận email chưa |
| **Tài khoản chưa có hồ sơ học viên — liên hệ ROVA** | Có tài khoản đăng nhập nhưng thiếu hồ sơ trong hệ thống | Nhắn mentor kèm email đăng ký — ROVA xử lý thủ công |
| **Không thể tạo tài khoản. Thử lại sau.** | Lỗi hệ thống / mạng | Chờ 1-2 phút thử lại. Vẫn lỗi → báo mentor |
| Bấm **Đăng ký** không có phản ứng | Chưa tick ô đồng ý điều khoản, hoặc còn ô trống | Tick ô điều khoản, điền đủ 4 ô |
| Đã được duyệt nhưng vẫn thấy bảng chờ | Trình duyệt còn giữ dữ liệu cũ | Bấm **Kiểm tra lại**. Vẫn vậy → Đăng xuất rồi đăng nhập lại |

---

## Câu hỏi hay gặp

**Duyệt mất bao lâu?**
Tuỳ mentor xử lý. Nhắn thẳng Zalo/Messenger cho mentor kèm email là nhanh nhất — hệ thống không tự gửi thông báo cho ROVA.

**Đăng ký bằng Google có phải chờ duyệt không?**
Có. Google chỉ bỏ qua bước xác nhận email, vẫn phải chờ ROVA duyệt.

**Đăng ký Google rồi, giờ đăng nhập bằng mật khẩu được không?**
Không. Đã dùng Google thì luôn bấm **Đăng nhập bằng Google**.

**Đổi email đăng ký được không?**
Không tự đổi được. Đăng ký tài khoản mới bằng email đúng, rồi báo mentor bỏ tài khoản cũ.

**Học trên điện thoại được không?**
Được. Giao diện chạy tốt trên trình duyệt điện thoại — cùng đường link, cùng tài khoản.

---

## Cần hỗ trợ

Nhắn mentor / bạn tư vấn qua **Zalo hoặc Messenger**, kèm đủ 3 thông tin:

1. **Email đã đăng ký**
2. **Họ tên** khai lúc đăng ký
3. **Ảnh chụp màn hình lỗi** (nếu có)
