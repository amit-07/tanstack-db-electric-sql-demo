import { createServerFn } from '@tanstack/react-start';
import { db } from '../server/db';
import { debtSchema } from '../universal/entities';
import { DebtType } from '../universal/types';
import { authDebt, authWorkbook, getTxId } from './helpers';

export const createDebt = createServerFn({ method: 'POST' })
  .inputValidator(
    debtSchema
      .pick({
        id: true,
        workbookId: true,
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
      })
      .extend({
        name: debtSchema.shape.name.optional().default('Chase Visa'),
        type: debtSchema.shape.type.optional().default(DebtType.Credit),
        rate: debtSchema.shape.rate.optional().default('0'),
        balance: debtSchema.shape.balance.optional().default('0'),
        minPayment: debtSchema.shape.minPayment.optional().default('0'),
      }),
  )
  .handler(async ({ data }) => {
    await authWorkbook(data.workbookId);

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.create({
        data: data,
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
      },
      txid,
    };
  });

export const updateDebt = createServerFn({ method: 'POST' })
  .inputValidator(
    debtSchema
      .pick({
        id: true,
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
      })
      .partial({
        name: true,
        type: true,
        rate: true,
        balance: true,
        minPayment: true,
      }),
  )
  .handler(async ({ data }) => {
    await authDebt(data.id);

    // Build update data with only provided fields
    const updateData: {
      name?: string;
      type?: string;
      rate?: string;
      balance?: string;
      minPayment?: string;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.rate !== undefined) updateData.rate = data.rate;
    if (data.balance !== undefined) updateData.balance = data.balance;
    if (data.minPayment !== undefined) updateData.minPayment = data.minPayment;

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.update({
        where: { id: data.id },
        data: updateData,
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
      },
      txid,
    };
  });

export const deleteDebt = createServerFn({ method: 'POST' })
  .inputValidator(debtSchema.pick({ id: true }))
  .handler(async ({ data }) => {
    await authDebt(data.id);

    const [debt, [{ txid }]] = await db.$transaction([
      db.debt.delete({
        where: { id: data.id },
      }),
      getTxId(),
    ]);
    return {
      debt: {
        ...debt,
        rate: debt.rate.toString(),
        balance: debt.balance.toString(),
        minPayment: debt.minPayment.toString(),
      },
      txid,
    };
  });
