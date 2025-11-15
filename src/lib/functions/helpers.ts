import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '../server/auth';
import { db } from '../server/db';

export const authUser = async () => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  const user = session?.user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
};

export const authDebt = async (debtId: string) => {
  const user = await authUser();
  const debt = await db.debt.findFirst({
    select: { id: true },
    where: { id: debtId, workbook: { ownerId: user.id } },
  });
  if (!debt) {
    throw new Error('Debt not found or access denied');
  }
  return { user, debt };
};

export const authWorkbook = async (workbookId: string) => {
  const user = await authUser();
  const workbook = await db.workbook.findFirst({
    select: { id: true },
    where: { id: workbookId, ownerId: user.id },
  });
  if (!workbook) {
    throw new Error('Workbook not found or access denied');
  }
  return { user, workbook };
};

export const getTxId = () =>
  db.$queryRaw<
    [{ txid: number }]
  >`SELECT pg_current_xact_id()::xid::text::int as txid`;
