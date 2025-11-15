import { createServerFn } from '@tanstack/react-start';
import { db } from '../server/db';
import { workbookSchema } from '../universal/entities';
import { authUser, getTxId } from './helpers';

export const createWorkbook = createServerFn({ method: 'POST' })
  .inputValidator(
    workbookSchema.pick({ id: true, name: true }).extend({
      name: workbookSchema.shape.name.optional().default('My Workbook'),
    }),
  )
  .handler(async ({ data }) => {
    const user = await authUser();
    const [workbook, [{ txid }]] = await db.$transaction([
      db.workbook.create({
        data: { ...data, ownerId: user.id },
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
