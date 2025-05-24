/**
 * Tiện ích gửi email
 * Chú ý: Đây là triển khai mẫu, cần tích hợp với dịch vụ email thực tế như SendGrid, AWS SES, v.v.
 */

type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

/**
 * Gửi email
 * @param options Các tùy chọn email
 * @returns Promise<boolean> Kết quả gửi email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log(`[EMAIL] Sending email to ${options.to}`);
    console.log(`[EMAIL] Subject: ${options.subject}`);
    console.log(`[EMAIL] Content: ${options.text || options.html}`);
    
    // TODO: Tích hợp với dịch vụ email thực tế
    // Ví dụ với Nodemailer:
    // const transporter = nodemailer.createTransport({...});
    // await transporter.sendMail({...});
    
    // Giả lập gửi thành công
    return true;
  } catch (error) {
    console.error("[EMAIL] Error sending email:", error);
    return false;
  }
}

/**
 * Tạo template email quên mật khẩu
 * @param resetToken Token đặt lại mật khẩu
 * @param userName Tên người dùng
 * @returns Template HTML cho email
 */
export function createPasswordResetEmailTemplate(resetToken: string, userName: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Đặt lại mật khẩu của bạn</h2>
      <p>Xin chào ${userName},</p>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng token sau để đặt lại mật khẩu:</p>
      <div style="background-color: #f4f4f4; padding: 10px; font-family: monospace; margin: 15px 0;">
        ${resetToken}
      </div>
      <p>Token này sẽ hết hạn sau 30 phút.</p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
      <p>Trân trọng,<br>Đội ngũ Wibu System</p>
    </div>
  `;
}
