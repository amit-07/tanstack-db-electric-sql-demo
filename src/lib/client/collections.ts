import { electricCollectionOptions } from '@tanstack/electric-db-collection';
import { createCollection } from '@tanstack/react-db';
import { workbookSchema } from '../universal/entities';

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
  }),
);
