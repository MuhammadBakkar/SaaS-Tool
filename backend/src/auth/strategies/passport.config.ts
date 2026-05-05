import { registerGoogleStrategy } from "./google.strategy.js";
import { registerJwtStrategy } from "./jwt.strategy.js";

export function configurePassport(): void {
  registerJwtStrategy();
  registerGoogleStrategy();
}
