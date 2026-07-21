import type { Prisma } from '@prisma/client';

export async function lockProjectForUpdate(
  transaction: Prisma.TransactionClient,
  projectId: string
): Promise<boolean> {
  const rows = await transaction.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "projects"
    WHERE "id" = ${projectId}::uuid
    FOR UPDATE
  `;

  return rows.length > 0;
}
