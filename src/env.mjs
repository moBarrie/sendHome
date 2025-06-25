import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    MONIME_API_KEY: z.string().min(1),
    MONIME_WEBHOOK_SECRET: z.string().min(1),
  },
  client: {},
  runtimeEnv: {
    MONIME_API_KEY: process.env.MONIME_API_KEY,
  },
});
