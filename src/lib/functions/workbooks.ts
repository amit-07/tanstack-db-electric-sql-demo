import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { db } from '../server/db';
import { workbookSchema } from '../universal/entities';
import { auth } from '../server/auth';

const authUser = async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  const user = session?.user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

const getTxId = () =>
  db.$queryRaw<
    [{ txid: number }]
  >`SELECT pg_current_xact_id()::xid::text::int as txid`;

export const createWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(
    workbookSchema.pick({ name: true }).extend({
      name: workbookSchema.shape.name.optional().default('My Workbook'),
    }),
  )
  .handler(async ({ data }) => {
    const user = await authUser();
    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.create({
        data: { name: data.name, ownerId: user.id },
      }),
      getTxId(),
    ]);
    return { workbook, txid };
  });

export const updateWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(workbookSchema.pick({ id: true, name: true }))
  .handler(async ({ data }) => {
    const user = await authUser();
    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.update({
        where: { id: data.id, ownerId: user.id },
        data: { name: data.name },
      }),
      getTxId(),
    ]);
    return { workbook, txid };
  });
