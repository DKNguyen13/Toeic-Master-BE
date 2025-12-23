# TOEIC MASTER – Backend API

## 📌 Giới thiệu
**Toeic Master Backend** là hệ thống **Backend API** cho website luyện thi TOEIC, được xây dựng bằng **Node.js + Express + MongoDB** theo mô hình **MERN Stack**.

Backend cung cấp API cho:
- Frontend User (người học)
- Frontend Admin (quản trị hệ thống)

---

## 👨‍🎓 Nhóm sinh viên thực hiện
- **Dương Khánh Nguyên** – 22110383  
- **Nguyễn Nhật Nguyên** – 22110384  

---

📝 Ghi chú
Dự án được xây dựng phục vụ mục đích học tập và báo cáo môn học.

---

## 🛠️ Công nghệ sử dụng
- **Node.js**
- **Express.js**
- **MongoDB & Mongoose**
- **JWT Authentication**
- **Upstash Redis**
- **Socket.IO (Realtime)**
- **Cloudinary (Upload file)**
- **Node-cron**
- **MailerSend**
- **Google OAuth**

---

## 📦 Thư viện chính
- express
- mongoose
- jsonwebtoken
- bcryptjs
- cors
- cookie-parser
- dotenv
- @upstash/redis
- socket.io
- cloudinary
- multer
- nodemailer
- mailersend
- node-cron

---

## 📈 Chức năng chính

### 👤 Quản lý tài khoản người dùng
- Đăng ký, đăng nhập, đăng xuất
- Quên mật khẩu, đổi mật khẩu
- Xem và cập nhật thông tin cá nhân
- Kích hoạt / vô hiệu hóa tài khoản

### 💳 Quản lý gói nâng cấp tài khoản
- Xem danh sách các gói nâng cấp
- Mua gói nâng cấp tài khoản
- Xem lịch sử mua gói

### 📚 Hệ thống học tập và bài học TOEIC
- Xem danh sách và tìm kiếm bài học
- Xem chi tiết nội dung bài học
- Luyện nghe và điền từ còn thiếu
- Hệ thống flashcard hỗ trợ ghi nhớ từ vựng

### 📝 Luyện thi TOEIC trực tuyến
- Làm bài thi TOEIC online
- Lưu kết quả làm bài
- Xem kết quả và đáp án bài thi

### 🤖 Hỗ trợ học tập bằng AI
- Gợi ý và nhận xét kết quả học tập từ AI
- Chatbot hỗ trợ học tiếng Anh

### 💬 Tương tác và hỗ trợ người dùng
- Thêm, chỉnh sửa, xóa bình luận
- Hỗ trợ và liên hệ người dùng

### 🛠️ Quản lý hệ thống (Admin)
- Quản lý người dùng
- Quản lý bài học
- Tạo và xóa đề thi TOEIC
- Thống kê và quản lý doanh thu

### 🔐 Xác thực & hệ thống
- Xác thực và phân quyền người dùng (User / Admin)
- Upload file và hình ảnh
- Gửi email xác thực và thông báo

---

## 🔐 Biến môi trường (.env)

Tạo file `.env` trong thư mục gốc và cấu hình các biến môi trường sau:
```env
PORT=8080

# Database
MONGODB_URI=

# JWT
ACCESS_TOKEN_KEY=
ACCESS_TOKEN_LIFE=1d
REFRESH_TOKEN_KEY=
REFRESH_TOKEN_LIFE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Redis
REDIS_URL=
REDIS_TOKEN=

# Mail
MAIL_HOST=
MAIL_PORT=
MAIL_USER=
MAIL_PASS=
SUPPORT_EMAIL=
MAILERSEND_API_KEY=

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_SERVER_CALLBACK=

# Cookie
COOKIE_SECURE=false
COOKIE_SAME_SITE=strict

# Payment (Sandbox)
VNP_TMNCODE=
VNP_HASHSECRET=
VNP_URL=
VNP_RETURNURL=
PAYMENT_SUCCESS_PATH=
PAYMENT_FAIL_PATH=

# Frontend URLs
FRONTEND_URL=
ADMIN_URL=
BACKEND_URL=

# AI Services
GROQ_API_KEY=
OLLAMA_API_KEY=
OLLAMA_MODEL=
```
---

## 🚀 Cách chạy Backend (Local)

### 1️⃣ Cài đặt dependencies
npm install

### 2️⃣ Tạo file `.env`
Tạo file `.env` trong thư mục gốc và cấu hình các biến môi trường theo mẫu bên dưới.

### 3️⃣ Chạy server
npm run dev

