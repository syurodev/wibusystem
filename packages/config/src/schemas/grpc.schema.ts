import { z } from "zod";

export const GrpcEnvSchema = z
  .object({
    GRPC_SERVER_HOST: z.string().ip({ version: "v4" }).optional(),
    GRPC_SERVER_PORT: z.coerce.number().positive().optional(),
  })
  .catchall(z.string().url().optional()); // Allows for GRPC_SERVICE_NAME_URL type variables

export type GrpcEnv = z.infer<typeof GrpcEnvSchema> & {
  [key: `GRPC_${string}_URL`]: string | undefined;
};
