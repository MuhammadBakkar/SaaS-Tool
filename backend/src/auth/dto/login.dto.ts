import { type z } from "zod";
import { loginSchema } from "./schemas.js";

export { loginSchema };
export type LoginDto = z.infer<typeof loginSchema>;
