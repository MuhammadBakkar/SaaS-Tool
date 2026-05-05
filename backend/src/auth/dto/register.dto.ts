import { type z } from "zod";
import { registerSchema } from "./schemas.js";

export { registerSchema };
export type RegisterDto = z.infer<typeof registerSchema>;
