// Script để generate TypeScript types từ proto files
import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const PROTO_DIR = resolve(__dirname, "../proto");
const GENERATED_DIR = resolve(__dirname, "../generated");
const ROOT_DIR = resolve(__dirname, "../../..");

// Tạo thư mục generated nếu chưa tồn tại
if (!existsSync(GENERATED_DIR)) {
  mkdirSync(GENERATED_DIR, { recursive: true });
}

console.log("🚀 Generating TypeScript types from proto files...");

try {
  // List of proto files
  const protoFiles = ["user.proto", "auth.proto", "notification.proto"];

  for (const protoFile of protoFiles) {
    const protoPath = join(PROTO_DIR, protoFile);
    const serviceName = protoFile.replace(".proto", "");

    console.log(`📄 Processing ${protoFile}...`);

    // Generate TypeScript definitions using protoc
    const command = [
      "protoc",
      `--plugin=protoc-gen-ts=${ROOT_DIR}/node_modules/.bin/protoc-gen-ts`,
      `--ts_out=${GENERATED_DIR}`,
      `--proto_path=${PROTO_DIR}`,
      protoPath,
    ].join(" ");

    try {
      execSync(command, {
        stdio: "inherit",
        cwd: ROOT_DIR,
      });
      console.log(`✅ Generated types for ${serviceName}`);
    } catch (error) {
      console.warn(
        `⚠️  Could not generate types for ${serviceName} using protoc`
      );
      console.warn(
        "This is expected if protoc or protoc-gen-ts is not installed"
      );
      console.warn(
        "You can still use the proto files directly with @grpc/proto-loader"
      );
    }
  }

  // Generate index file for types
  const indexContent = `// Generated gRPC TypeScript definitions
// This file is auto-generated - do not edit manually

export * from "./user_pb.js";
export * from "./auth_pb.js";
export * from "./notification_pb.js";

// Re-export for convenience
export { loadAllProtos, loadServiceConstructors } from "../proto/index.js";
`;

  const fs = await import("fs/promises");
  await fs.writeFile(join(GENERATED_DIR, "index.ts"), indexContent);

  console.log("✅ Generated index file for types");
  console.log("🎉 Type generation completed!");
} catch (error) {
  console.error("❌ Error generating types:", error);
  console.log("\n💡 Note: Type generation requires protoc and protoc-gen-ts");
  console.log("Install with: npm install -g protoc-gen-ts");
  console.log("And ensure protoc is installed on your system");
  process.exit(1);
}
