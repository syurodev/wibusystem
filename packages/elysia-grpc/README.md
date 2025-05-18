# @repo/elysia-grpc

A plugin for [ElysiaJS](https://elysiajs.com/) to easily integrate and manage gRPC services within your Elysia application. This allows you to define your services using Protocol Buffers (`.proto` files) and implement their handlers in TypeScript. The package also provides utilities for creating gRPC clients.

## Features

- Simplified gRPC server setup within ElysiaJS.
- Utility function to easily create gRPC clients.
- Load gRPC service definitions from multiple `.proto` files for both server and client.
- Support for multiple gRPC packages and services.
- Automatic gRPC server lifecycle management (start/stop) with Elysia app.
- Configurable `proto-loader` options for server and client.
- Support for custom gRPC server credentials and client channel credentials.

## Usage

### gRPC Server with ElysiaJS

1.  **Define your `.proto` files:**
    Create your service definitions using Protocol Buffers.

    Example (`protos/greeter.proto`):

    ```protobuf
    syntax = "proto3";

    package com.example.greeter;

    service GreeterService {
      rpc SayHello (HelloRequest) returns (HelloReply);
    }

    message HelloRequest {
      string name = 1;
    }

    message HelloReply {
      string message = 1;
    }
    ```

2.  **Implement Service Handlers:**
    Create TypeScript functions to handle your gRPC service methods.

    **Option A: Direct Handler Objects (Simple)**

    Example (`src/grpc-handlers/greeter.handler.ts`):

    ```typescript
    import * as _grpc from "@grpc/grpc-js";

    export const greeterServiceHandlers = {
      SayHello: (
        call: _grpc.ServerUnaryCall<any, any>,
        callback: _grpc.sendUnaryData<any>
      ) => {
        const name = call.request.name || "world";
        callback(null, { message: `Hello ${name} from gRPC!` });
      },
    };
    ```

    **Option B: Using a Controller-like Class (for better organization)**

    This approach helps in organizing your gRPC logic, especially for larger applications, similar to how controllers are used in frameworks like NestJS (though without decorators).

    Example (`src/grpc-controllers/greeter.controller.ts`):

    ```typescript
    import * as _grpc from "@grpc/grpc-js";

    // Assuming these types are generated from your .proto or defined manually
    interface HelloRequestProto {
      name?: string;
    }
    interface HelloReplyProto {
      message: string;
    }

    export class GreeterGrpcController {
      constructor() {
        // Dependencies can be injected here if using a DI system
      }

      // This method will handle the 'SayHello' RPC
      sayHello(
        call: _grpc.ServerUnaryCall<HelloRequestProto, HelloReplyProto>,
        callback: _grpc.sendUnaryData<HelloReplyProto>
      ): void {
        const name = call.request?.name || "world (from Controller)";
        console.log(`[GreeterGrpcController] Handling SayHello for: ${name}`);
        callback(null, {
          message: `Hello ${name}, this is gRPC via Elysia Controller pattern!`,
        });
      }

      // Add other RPC handlers for GreeterService as methods here
    }
    ```

3.  **Integrate with ElysiaJS:**
    Use the `grpc` plugin in your Elysia application setup.

    Example (`src/index.ts`):

    If using **Option A (Direct Handler Objects)**:

    ```typescript
    import { Elysia } from "elysia";
    import {
      grpc,
      GrpcProtoDefinition,
      ServiceImplementationMap,
    } from "@repo/elysia-grpc";
    import path from "path";
    import * as _grpc from "@grpc/grpc-js"; // Required for handler types
    import { greeterServiceHandlers } from "./grpc-handlers/greeter.handler"; // Import direct handlers

    const HTTP_PORT = process.env.HTTP_PORT || 3000;
    const GRPC_URL = process.env.GRPC_URL || "0.0.0.0:50051";

    const protoDefinitions: GrpcProtoDefinition[] = [
      {
        packageName: "com.example.greeter", // Must match the package in your .proto file
        protoPath: path.join(__dirname, "../protos/greeter.proto"),
      },
      // Add more proto definitions if needed
    ];

    const serviceHandlers: ServiceImplementationMap = {
      // Key is 'packageName.ServiceName'
      "com.example.greeter.GreeterService": greeterServiceHandlers,
      // Add more service handlers if needed
    };

    const app = new Elysia()
      .use(
        grpc({
          url: GRPC_URL,
          protoDefinitions,
          serviceHandlers,
          // Optional: configure proto-loader
          protoLoaderOptions: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
          },
          // Optional: configure gRPC server credentials
          // serverCredentials: _grpc.ServerCredentials.createSsl(...),
        })
      )
      .get("/", () => "Elysia HTTP server is running alongside gRPC server!")
      .listen(HTTP_PORT);

    console.log(
      `🦊 Elysia HTTP server running at http://${app.server?.hostname}:${HTTP_PORT}`
    );
    // The gRPC plugin will log the status of the gRPC server
    ```

    If using **Option B (Controller-like Class)**:

    ```typescript
    import { Elysia } from "elysia";
    import {
      grpc,
      GrpcProtoDefinition,
      ServiceImplementationMap,
    } from "@repo/elysia-grpc";
    import path from "path";
    import * as _grpc from "@grpc/grpc-js";
    import { GreeterGrpcController } from "./grpc-controllers/greeter.controller"; // Import the controller

    const HTTP_PORT = process.env.HTTP_PORT || 3000;
    const GRPC_URL = process.env.GRPC_URL || "0.0.0.0:50051";

    // Instantiate your controller
    const greeterController = new GreeterGrpcController();

    const protoDefinitions: GrpcProtoDefinition[] = [
      {
        packageName: "com.example.greeter", // Must match the package in your .proto file
        protoPath: path.join(__dirname, "../protos/greeter.proto"),
      },
    ];

    const serviceHandlers: ServiceImplementationMap = {
      // Key is 'packageName.ServiceName'
      "com.example.greeter.GreeterService": {
        // Map RPC method names from .proto to controller methods
        // IMPORTANT: Use .bind(controllerInstance) to maintain correct 'this' context
        SayHello: greeterController.sayHello.bind(greeterController),
        // Add other RPC methods for GreeterService here
        // AnotherMethod: greeterController.anotherMethod.bind(greeterController),
      },
    };

    const app = new Elysia()
      .use(
        grpc({
          url: GRPC_URL,
          protoDefinitions,
          serviceHandlers,
          // Optional: configure proto-loader, serverCredentials etc.
        })
      )
      .get("/", () => "Elysia HTTP server is running alongside gRPC server!")
      .listen(HTTP_PORT);

    console.log(
      `🦊 Elysia HTTP server running at http://${app.server?.hostname}:${HTTP_PORT}`
    );
    // The gRPC plugin will log the status of the gRPC server
    ```

### Creating and Using gRPC Clients

The package also exports a `createGrpcClient` utility function to easily create gRPC clients.

1.  **Ensure you have Type Definitions for Client (Recommended):**
    For the best development experience and type safety, generate TypeScript definitions from your `.proto` files using tools like `ts-proto` or `grpc-tools` with `grpc_tools_node_protoc_ts`.

    Example (conceptual, assuming `ts-proto` generated types):

    ```typescript
    // This would be in a generated file, e.g., greeter.ts
    import * as _grpc from "@grpc/grpc-js";
    export interface GreeterServiceClient extends _grpc.Client {
      sayHello(
        request: HelloRequest,
        callback: (
          error: _grpc.ServiceError | null,
          response: HelloReply
        ) => void
      ): _grpc.ClientUnaryCall;
      sayHello(
        request: HelloRequest,
        metadata: _grpc.Metadata,
        callback: (
          error: _grpc.ServiceError | null,
          response: HelloReply
        ) => void
      ): _grpc.ClientUnaryCall;
      // ... other methods if any
    }
    export interface HelloRequest {
      name?: string;
    }
    export interface HelloReply {
      message?: string;
    }
    ```

2.  **Create a Client Instance:**
    Use `createGrpcClient` in your application code where you need to call a gRPC service.

    Example (`src/some-service-that-uses-grpc-client.ts`):

    ```typescript
    import { createGrpcClient } from "@repo/elysia-grpc";
    import path from "path";
    import * as _grpc from "@grpc/grpc-js";

    // Assuming you have generated types (conceptual)
    // import { GreeterServiceClient, HelloRequest, HelloReply } from './generated/greeter';

    // For demonstration, defining simplified client type and request/response interfaces
    // In a real app, these would ideally come from generated code
    interface GreeterServiceClient extends _grpc.Client {
      sayHello: (
        request: { name?: string },
        callback: (
          error: _grpc.ServiceError | null,
          response: { message?: string }
        ) => void
      ) => _grpc.ClientUnaryCall;
    }

    async function callGreeterService() {
      const greeterClient = createGrpcClient<GreeterServiceClient>({
        protoPath: path.join(__dirname, "../protos/greeter.proto"),
        packageName: "com.example.greeter",
        serviceName: "GreeterService",
        url: "localhost:50051", // Address of the gRPC server
        // credentials: _grpc.credentials.createSsl(...), // Optional for secure connection
      });

      // Promisify the client call for cleaner async/await usage (optional)
      const sayHelloAsync = (request: {
        name?: string;
      }): Promise<{ message?: string }> => {
        return new Promise((resolve, reject) => {
          greeterClient.sayHello(request, (error, response) => {
            if (error) return reject(error);
            resolve(response);
          });
        });
      };

      try {
        const response = await sayHelloAsync({ name: "Elysia Client" });
        console.log("gRPC Server Response:", response.message);
      } catch (error) {
        console.error("gRPC Error:", error);
      }

      // Close the client when done (important for resource management)
      greeterClient.close();
    }

    callGreeterService();
    ```

## API

### `grpc(options: ElysiaGrpcPluginOptions)`

The main plugin function to be used with `app.use()`.

#### `ElysiaGrpcPluginOptions`

- `url: string`: The URL for the gRPC server to listen on (e.g., `'0.0.0.0:50051'`).
- `protoDefinitions: GrpcProtoDefinition[]`: An array of proto file definitions.
- `serviceHandlers: ServiceImplementationMap`: An object mapping fully qualified service names to their handler implementations.
- `protoLoaderOptions?: import('@grpc/proto-loader').Options`: Optional. Options to pass to `@grpc/proto-loader`.
- `serverCredentials?: import('@grpc/grpc-js').ServerCredentials`: Optional. gRPC server credentials (e.g., for SSL/TLS). Defaults to insecure credentials.

#### `GrpcProtoDefinition`

- `packageName: string`: The package name as defined in your `.proto` file (e.g., `'com.example.greeter'`).
- `protoPath: string`: The absolute or relative path to the `.proto` file.

#### `ServiceImplementationMap`

An object where keys are fully qualified service names (e.g., `'com.example.greeter.GreeterService'`) and values are objects containing the gRPC method implementations for that service. Each method implementation should match the `_grpc.UntypedHandleCall` signature.

Example for direct handlers:

```typescript
{
  'packageName.ServiceName': {
    MethodName1: (call, callback) => { /* ... */ },
    MethodName2: (call, callback) => { /* ... */ },
  }
}
```

Example when mapping from a controller instance:

```typescript
{
  'packageName.ServiceName': {
    ProtoMethodName1: controllerInstance.handlerMethod1.bind(controllerInstance),
    ProtoMethodName2: controllerInstance.handlerMethod2.bind(controllerInstance),
  }
}
```

### Client Utility: `createGrpcClient<TClient extends Client>(options: GrpcClientOptions): TClient`

A utility function to create gRPC client instances.

#### `GrpcClientOptions`

- `protoPath: string`: Path to the `.proto` file.
- `packageName: string`: Package name from the `.proto` file.
- `serviceName: string`: Name of the service to create a client for.
- `url: string`: Address of the gRPC server (e.g., `'localhost:50051'`).
- `credentials?: import('@grpc/grpc-js').ChannelCredentials`: Optional. gRPC channel credentials. Defaults to insecure.
- `protoLoaderOptions?: import('@grpc/proto-loader').Options`: Optional. Options for `proto-loader`.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This package is licensed under the MIT License. (Or your preferred license - adjust if necessary)
