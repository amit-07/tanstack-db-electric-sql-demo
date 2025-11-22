import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { createDebt, deleteDebt, updateDebt } from '../functions/debts';
import { createWorkbook, updateWorkbook } from '../functions/workbooks';
import { debtSchema, workbookSchema } from '../universal/entities';

// Construct absolute URL for Electric sync
// In browser: uses window.location.origin
// Fallback for SSR or other contexts
const getElectricUrl = () => {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/electric`;
  }
  // Fallback for SSR (shouldn't be used since dashboard has ssr: false)
  return process.env.VITE_APP_URL
    ? `${process.env.VITE_APP_URL}/api/electric`
    : 'http://localhost:3000/api/electric';
};

export const workbooksCollection = createCollection(
  electricCollectionOptions({
    id: 'workbooks',
    schema: workbookSchema,
    shapeOptions: {
      url: getElectricUrl(),
      params: { table: 'workbooks' },
    },
    getKey: (item) => item.id,

    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified;
      const { txid } = await createWorkbook({ data: newItem });

      return { txid };
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      if (!changes.name) {
        throw new Error('Name is required');
      }
      const { txid } = await updateWorkbook({
        data: { id: original.id, name: changes.name },
      });

      return { txid };
    },
  }),
);

export const debtsCollection = createCollection(
  electricCollectionOptions({
    id: 'debts',
    schema: debtSchema,
    shapeOptions: {
      url: getElectricUrl(),
      params: { table: 'debts' },
    },
    getKey: (item) => item.id,

    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified;
      const { txid } = await createDebt({ data: newItem });

      return { txid };
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0];
      const { txid } = await updateDebt({
        data: {
          id: original.id,
          ...changes,
        },
      });

      return { txid };
    },

    onDelete: async ({ transaction }) => {
      const deletedItem = transaction.mutations[0].original;
      const { txid } = await deleteDebt({
        data: { id: deletedItem.id },
      });

      return { txid };
    },
  }),
);
