/**
 * Mã hóa mật khẩu sử dụng bcrypt
 * @param password Mật khẩu cần hash
 * @param rounds Số vòng bcrypt (độ khó)
 * @returns Mật khẩu đã được hash
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Bun.password.hash mặc định sử dụng Argon2id.
  // Các tham số như timeCost, memoryCost, parallelism sẽ sử dụng giá trị mặc định của Bun.
  return await Bun.password.hash(password);
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
  // Bun.password.verify tự động phát hiện thuật toán của hash
  return await Bun.password.verify(password, hashedPassword);
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
