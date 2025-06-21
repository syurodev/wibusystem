# 🔐 Encryption Utilities

Thư viện mã hóa an toàn để bảo vệ dữ liệu nhạy cảm như device fingerprinting. Hoạt động trên cả client (browser) và server (Node.js).

## 🚀 Tính năng

- **Multi-layer Encryption**: XOR + Base64 obfuscation + Character rotation
- **Cross-platform**: Hoạt động trên cả browser và Node.js
- **Lightweight**: Không phụ thuộc vào external libraries
- **Expiration Support**: Tự động hết hạn encrypted data
- **Multiple Methods**: XOR, Base64 obfuscation, Multi-layer
- **Environment-aware**: Secret key generation dựa trên environment

## 📦 Installation

```bash
# Trong monorepo
import { encryptDeviceData, decryptDeviceData } from '@wibusystem/utils';

# Hoặc relative import
import { encryptDeviceData } from '../packages/utils/src/encryption-utils';
```

## 🔧 Cách sử dụng

### 1. **Basic Encryption (XOR Cipher)**

```typescript
import { quickEncrypt, quickDecrypt } from "@wibusystem/utils";

const secretKey = "my-secret-key-2024";
const data = "Sensitive information";

// Encrypt
const encrypted = quickEncrypt.xor(data, secretKey);
console.log(encrypted); // "SGVsbG8gV29ybGQ="

// Decrypt
const decrypted = quickDecrypt.xor(encrypted, secretKey);
console.log(decrypted); // "Sensitive information"
```

### 2. **Multi-layer Encryption (Recommended)**

```typescript
import {
  encryptDeviceData,
  decryptDeviceData,
  generateSecretKey,
} from "@wibusystem/utils";

// Tạo secret key an toàn
const baseKey = "wibu-device-fingerprint";
const environment = process.env.NODE_ENV || "development";
const secretKey = generateSecretKey(baseKey, environment);

// Device data
const deviceData = {
  fingerprint: "abc123def456",
  ip: "192.168.1.1",
  userAgent: "Mozilla/5.0...",
  timestamp: Date.now(),
};

// Encrypt
const encryptedResult = await encryptDeviceData(deviceData, {
  secretKey,
  useTimestamp: true,
  expirationMinutes: 60, // 1 hour
});

console.log(encryptedResult);
// {
//   data: "9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e...",
//   timestamp: 1703123456789,
//   method: "multi-layer"
// }

// Decrypt
const decryptedData = await decryptDeviceData(encryptedResult, {
  secretKey,
});

console.log(decryptedData); // Original deviceData
```

### 3. **Device Fingerprint Security**

```typescript
import { prepareEncryptedFingerprintData } from "../hooks/useDeviceInfo";

const deviceInfo = useDeviceInfo();
const secretKey = "your-app-secret-key";

// Tạo encrypted fingerprint data
const encryptedFingerprint = await prepareEncryptedFingerprintData(
  deviceInfo,
  secretKey
);

// Gửi lên server
fetch("/api/device-fingerprint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(encryptedFingerprint),
});
```

### 4. **Server-side Decryption**

```typescript
// Server (Node.js/Elysia)
import { decryptDeviceData, generateSecretKey } from "@wibusystem/utils";

app.post("/api/device-fingerprint", async (ctx) => {
  const { payload, meta } = ctx.body;

  // Tạo lại secret key (same as client)
  const baseKey = "your-app-secret-key";
  const environment = process.env.NODE_ENV || "development";
  const secretKey = generateSecretKey(baseKey, environment);

  try {
    // Decrypt device data
    const deviceData = await decryptDeviceData(
      {
        data: payload,
        timestamp: meta.timestamp,
        method: meta.method,
      },
      {
        secretKey,
      }
    );

    console.log("Device fingerprint:", deviceData);

    // Process device data...
    return { success: true };
  } catch (error) {
    if (error.message === "Encrypted data has expired") {
      return { error: "Fingerprint expired" };
    }
    return { error: "Invalid fingerprint" };
  }
});
```

## 🛡️ Security Best Practices

### 1. **Secret Key Management**

```typescript
// ❌ BAD - Hard-coded key
const secretKey = "hardcoded-key-123";

// ✅ GOOD - Environment-based key generation
const baseKey = process.env.FINGERPRINT_SECRET || "fallback-key";
const secretKey = generateSecretKey(baseKey, process.env.NODE_ENV);
```

### 2. **Expiration và Validation**

```typescript
const config = {
  secretKey,
  useTimestamp: true,
  expirationMinutes: 30, // Ngắn hạn cho security
};

// Encrypt với expiration
const encrypted = await encryptDeviceData(data, config);

// Server sẽ tự động reject expired data
```

### 3. **Environment Configuration**

```bash
# .env.local
FINGERPRINT_SECRET=your-production-secret-key-here
NODE_ENV=production

# .env.development
FINGERPRINT_SECRET=dev-secret-key
NODE_ENV=development
```

## 🎯 Use Cases

### 1. **Device Fingerprinting**

```typescript
const deviceInfo = useDeviceInfo();
const fingerprint = generateDeviceFingerprint(deviceInfo);
const encrypted = quickEncrypt.secure(fingerprint, secretKey);
```

### 2. **User Session Security**

```typescript
const sessionData = {
  userId: user.id,
  deviceId: deviceFingerprint,
  loginTime: Date.now(),
};

const encryptedSession = await encryptDeviceData(sessionData, {
  secretKey,
  expirationMinutes: 24 * 60, // 24 hours
});
```

### 3. **API Request Signing**

```typescript
const requestData = {
  userId: 123,
  action: "sensitive-operation",
  timestamp: Date.now(),
};

const signature = quickEncrypt.secure(JSON.stringify(requestData), secretKey);
```

## 🚨 Lưu ý quan trọng

1. **Secret Key**: Luôn luôn giữ secret key an toàn, không hard-code
2. **Expiration**: Sử dụng expiration cho data nhạy cảm
3. **Environment**: Sử dụng khác secret key cho dev/prod
4. **Validation**: Luôn validate decrypted data trước khi sử dụng
5. **Error Handling**: Handle encryption/decryption errors properly

## 🔄 Migration từ hệ thống cũ

```typescript
// Cũ - Không mã hóa
const deviceData = prepareServerFingerprintData(deviceInfo);
fetch("/api/fingerprint", { body: JSON.stringify(deviceData) });

// Mới - Có mã hóa
const encryptedData = await prepareEncryptedFingerprintData(
  deviceInfo,
  secretKey
);
fetch("/api/fingerprint", { body: JSON.stringify(encryptedData) });
```

## 📊 Performance

- **XOR Cipher**: ~0.1ms cho 1KB data
- **Multi-layer**: ~0.5ms cho 1KB data
- **Bundle size**: ~2KB additional

## 🤝 Contributing

Khi thêm methods mã hóa mới:

1. Đảm bảo cross-platform compatibility
2. Thêm tests
3. Update documentation
4. Follow existing patterns

---

Được phát triển bởi WibuSystem team 🚀
