/**
 * @file Các hàm tiện ích xử lý password (bcrypt).
 * @author Your Name
 */

/**
 * Các hàm tiện ích cho việc mã hóa và xác minh mật khẩu sử dụng bcrypt
 */

/**
 * Mã hóa mật khẩu sử dụng bcrypt
 * @param password Mật khẩu cần hash
 * @param rounds Số vòng bcrypt (độ khó)
 * @returns Mật khẩu đã được hash
 */
export const hashPassword = async (
  password: string,
  rounds: number = 10
): Promise<string> => {
  const bcrypt = require("bcrypt");
  return await bcrypt.hash(password, rounds);
};

/**
 * So sánh mật khẩu với hash
 * @param password Mật khẩu cần kiểm tra
 * @param hashedPassword Hash mật khẩu đã lưu trong database
 * @returns True nếu mật khẩu khớp, ngược lại False
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  const bcrypt = require("bcrypt");
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Tạo OTP cho việc reset mật khẩu
 * @param length Độ dài của OTP
 * @returns OTP được tạo ngẫu nhiên
 */
export const generateOtp = (length: number = 6): string => {
  const digits = "0123456789";
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }

  return otp;
};

/**
 * Hash OTP để lưu trong database
 * @param otp OTP cần hash
 * @param salt Salt để hash (thường là user ID hoặc một trường nào đó)
 * @returns OTP đã được hash
 */
export const hashOtp = async (otp: string, salt: string): Promise<string> => {
  const crypto = require("crypto");
  return crypto.createHmac("sha256", salt).update(otp).digest("hex");
};

// TODO: Cân nhắc cài đặt 'bcrypt' và sử dụng SALT_ROUNDS từ config.
