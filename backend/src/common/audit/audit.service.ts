import type { AuditAction } from "@prisma/client";
import { getPrisma } from "../../lib/prisma.js";

export async function writeAuditLog(input: {
  user_id?: string | null;
  action: AuditAction;
  entity_type?: string | null;
  entity_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const prisma = getPrisma();
  await prisma.auditLog.create({
    data: {
      user_id: input.user_id ?? null,
      action: input.action,
      entity_type: input.entity_type ?? null,
      entity_id: input.entity_id ?? null,
      ip_address: input.ip_address ?? null,
      user_agent: input.user_agent ?? null,
      metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    },
  });
}
