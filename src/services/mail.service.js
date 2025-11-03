import nodemailer from 'nodemailer';
import { config } from '../config/env.config.js';

const transporter = nodemailer.createTransport({
  host: config.mailHost,
  port: config.mailPort || 587,
  secure: false,
  auth: {
    user: config.mailUser,
    pass: config.mailPass,
  },
});

export const sendOTPEmail = async (to, otp) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Poppins', Arial, sans-serif; }
      .container { max-width: 640px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      .header { background: linear-gradient(135deg, #2a4d9b, #5e81f4); padding: 40px 30px; text-align: center; }
      .header h1 { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
      .content { padding: 40px; color: #2d3748; line-height: 1.8; }
      .otp-box { background: #edf2ff; padding: 15px 30px; border-radius: 10px; display: inline-block; font-size: 26px; font-weight: 600; color: #2a4d9b; letter-spacing: 3px; margin: 20px 0; border: 1px solid #d1dcff; }
      .button { display: inline-block; margin: 20px 0; background: #2a4d9b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 500; font-size: 16px; transition: background 0.3s ease, transform 0.2s ease; }
      .button:hover { background: #1e3a8a; transform: translateY(-2px); }
      .footer { background: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      .footer a { color: #2a4d9b; text-decoration: none; font-weight: 500; }
      .footer a:hover { text-decoration: underline; }
      @media (max-width: 600px) {
        .container { margin: 20px; }
        .content { padding: 25px; }
        .header h1 { font-size: 26px; }
        .otp-box { font-size: 22px; padding: 12px 20px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Toeic Master</h1>
      </div>
      <div class="content">
        <h2 style="color: #2a4d9b; font-size: 26px; font-weight: 600; margin-bottom: 20px;">Xác Thực OTP</h2>
        <p style="font-size: 16px;">Chào bạn,</p>
        <p style="font-size: 16px;">Bạn đã yêu cầu mã OTP để xác thực tài khoản. Vui lòng sử dụng mã dưới đây:</p>
        <div class="otp-box">${otp}</div>
        <p style="font-size: 16px;">Mã OTP này sẽ hết hạn sau <strong>10 phút</strong>.</p>
        <p style="font-size: 16px;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email hoặc liên hệ với chúng tôi qua <a href="http://localhost:3000/support" style="color: #2a4d9b; text-decoration: none; font-weight: 500;">hỗ trợ</a>.</p>
      </div>
      <div class="footer">
        <p>&copy; 2025 Toeic Master. Mọi quyền được bảo lưu.</p>
        <p><a href="http://localhost:3000/support">Liên hệ hỗ trợ</a> | <a href="http://localhost:3000/privacy">Chính sách bảo mật</a></p>
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Toeic Master" <${config.mailUser}>`,
    to,
    subject: "Xác Thực OTP Tài Khoản",
    html: htmlContent,
  });

  console.log(`OTP sent to ${to}: ${otp}`);
};

export const sendResetPasswordEmail = async (to, newPassword) => {
  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap');
      body { margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Poppins', Arial, sans-serif; }
      .container { max-width: 640px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
      .header { background: linear-gradient(135deg, #2a4d9b, #5e81f4); padding: 40px 30px; text-align: center; }
      .header h1 { color: #ffffff; font-size: 32px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
      .content { padding: 40px; color: #2d3748; line-height: 1.8; }
      .password-box { background: #edf2ff; padding: 15px 30px; border-radius: 10px; display: inline-block; font-size: 26px; font-weight: 600; color: #2a4d9b; letter-spacing: 3px; margin: 20px 0; border: 1px solid #d1dcff; }
      .button { display: inline-block; margin: 20px 0; background: #2a4d9b; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 10px; font-weight: 500; font-size: 16px; transition: background 0.3s ease, transform 0.2s ease; }
      .button:hover { background: #1e3a8a; transform: translateY(-2px); }
      .footer { background: #f8fafc; padding: 25px; text-align: center; font-size: 13px; color: #6b7280; border-top: 1px solid #e5e7eb; }
      .footer a { color: #2a4d9b; text-decoration: none; font-weight: 500; }
      .footer a:hover { text-decoration: underline; }
      @media (max-width: 600px) {
        .container { margin: 20px; }
        .content { padding: 25px; }
        .header h1 { font-size: 26px; }
        .password-box { font-size: 22px; padding: 12px 20px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Toeic Master</h1>
      </div>
      <div class="content">
        <h2 style="color: #2a4d9b; font-size: 26px; font-weight: 600; margin-bottom: 20px;">Mật Khẩu Mới</h2>
        <p style="font-size: 16px;">Chào bạn,</p>
        <p style="font-size: 16px;">Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là mật khẩu mới của bạn:</p>
        <div class="password-box">${newPassword}</div>
        <p style="font-size: 16px;">Vui lòng đăng nhập bằng mật khẩu này và đổi mật khẩu ngay sau khi đăng nhập.</p>
        <p style="font-size: 16px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng liên hệ đội ngũ hỗ trợ qua <a href="http://localhost:3000/support" style="color: #2a4d9b; text-decoration: none; font-weight: 500;">hỗ trợ</a>.</p>
        <a href="http://localhost:3000/login" class="button">Đăng Nhập Ngay</a>
      </div>
      <div class="footer">
        <p>&copy; 2025 Toeic Master. Mọi quyền được bảo lưu.</p>
        <p><a href="http://localhost:3000/support">Liên hệ hỗ trợ</a> | <a href="http://localhost:3000/privacy">Chính sách bảo mật</a></p>
      </div>
    </div>
  </body>
  </html>
  `;

  await transporter.sendMail({
    from: `"Toeic Master" <${config.mailUser}>`,
    to,
    subject: "Đặt Lại Mật Khẩu",
    html: htmlContent,
  });

  console.log(`Reset password sent to ${to}`);
};