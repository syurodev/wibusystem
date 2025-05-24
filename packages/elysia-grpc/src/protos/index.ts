import path from 'path';

// Export các đường dẫn tới các file proto
export const PROTO_PATHS = {
  auth: path.resolve(__dirname, './auth.proto'),
};

// Định nghĩa các package name trong proto
export const PROTO_PACKAGES = {
  auth: 'com.wibu.auth',
};

// Re-export các type từ file .ts được sinh ra từ proto
export * from './auth';
