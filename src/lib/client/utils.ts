import { clsx, type ClassValue } from 'clsx';
import Decimal from 'decimal.js';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Number formatting utilities for editable fields
export const toNumericValue = (
  val: string | number | Decimal,
): string | number => {
  return val instanceof Decimal ? val.toNumber() : val;
};

export const parseNumericInput = (val: string | number): number => {
  return typeof val === 'string'
    ? parseFloat(val.replace(/,/g, ''))
    : Number(val);
};

export const formatNumber = (val: string | number | Decimal): string => {
  if (val === '' || val === null || val === undefined) return '';

  const numericVal = toNumericValue(val);
  const num = parseNumericInput(numericVal);
  if (isNaN(num)) return String(val);

  const hasDecimals = Math.abs(num % 1) > 0.0001;
  return num.toLocaleString('en-US', {
    maximumFractionDigits: hasDecimals ? 2 : 0,
    minimumFractionDigits: 0,
  });
};
