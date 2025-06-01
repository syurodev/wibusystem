// Demo usage của proto files trong @repo/elysia-common
import { PROTO_PATHS, getProtoPath, loadAllProtos, loadServiceConstructors, } from "../src/proto/index.js";
console.log("=== @repo/elysia-common Proto Demo ===\n");
// 1. Proto Paths Demo
console.log("1. Proto File Paths:");
console.log("USER proto:", PROTO_PATHS.USER);
console.log("AUTH proto:", PROTO_PATHS.AUTH);
console.log("NOTIFICATION proto:", PROTO_PATHS.NOTIFICATION);
// 2. Load Proto Definitions
console.log("\n2. Loading Proto Definitions:");
try {
    const protos = loadAllProtos();
    console.log("✅ Successfully loaded all proto definitions");
    console.log("Available services:", Object.keys(protos));
    // Show available methods for each service
    console.log("\nService Methods:");
    console.log("User Service methods:", Object.keys(protos.user?.user?.UserService?.service || {}));
    console.log("Auth Service methods:", Object.keys(protos.auth?.auth?.AuthService?.service || {}));
    console.log("Notification Service methods:", Object.keys(protos.notification?.notification?.NotificationService
        ?.service || {}));
}
catch (error) {
    console.error("❌ Error loading proto definitions:", error);
}
// 3. Service Constructors Demo
console.log("\n3. Service Constructors:");
try {
    const constructors = loadServiceConstructors();
    console.log("✅ Successfully loaded service constructors");
    console.log("Available constructors:", Object.keys(constructors));
}
catch (error) {
    console.error("❌ Error loading service constructors:", error);
}
// 4. Helper Functions Demo
console.log("\n4. Helper Functions:");
console.log("Get USER proto path:", getProtoPath("USER"));
console.log("Get AUTH proto path:", getProtoPath("AUTH"));
// 5. Example gRPC Client Creation (theo lý thuyết)
console.log("\n5. gRPC Client Creation Example:");
console.log(`
// Example usage in your microservice:

import { loadServiceConstructors, createGrpcClient } from "@repo/elysia-common/proto";

const constructors = loadServiceConstructors();

// Create User Service client
const userClient = createGrpcClient(
  constructors.UserService,
  "localhost:50051"
);

// Create Auth Service client  
const authClient = createGrpcClient(
  constructors.AuthService,
  "localhost:50052"
);

// Use the clients
const user = await userClient.GetUser({ id: "123" });
const auth = await authClient.Login({ 
  email: "user@example.com", 
  password: "password123" 
});
`);
// 6. Proto File Structure
console.log("\n6. Proto File Structure:");
console.log(`
Các proto files được organize như sau:

📁 src/proto/
├── user.proto         - User management service
├── auth.proto         - Authentication service  
├── notification.proto - Notification service
├── index.ts           - Proto utilities và exports
└── README.md          - Proto documentation

📁 src/generated/       - Auto-generated TypeScript types (optional)
├── user_pb.ts         - Generated từ user.proto
├── auth_pb.ts         - Generated từ auth.proto
├── notification_pb.ts - Generated từ notification.proto
└── index.ts           - Export all generated types
`);
// 7. Integration với Microservices
console.log("\n7. Integration với Microservices:");
console.log(`
// Trong user-service/src/index.ts
import { Elysia } from "elysia";
import { loadServiceConstructors } from "@repo/elysia-common/proto";

const app = new Elysia();

// Load proto definitions
const { UserService } = loadServiceConstructors();

// Implement gRPC server
const server = new grpc.Server();
server.addService(UserService.service, {
  GetUser: async (call, callback) => {
    // Implementation logic
  },
  ListUsers: async (call, callback) => {
    // Implementation logic  
  },
  // ... other methods
});

// Trong notification-service có thể call user-service
const userClient = createGrpcClient(
  UserService,
  process.env.USER_SERVICE_URL ?? "localhost:50051"
);
`);
console.log("\n=== Proto Demo Complete ===");
console.log("\n💡 Tips:");
console.log("- Run 'bun run proto:build' để generate TypeScript types");
console.log("- Proto files được shared giữa tất cả microservices");
console.log("- Sử dụng same proto definitions đảm bảo API compatibility");
console.log("- Có thể version proto files bằng cách create folders v1/, v2/, etc.");
