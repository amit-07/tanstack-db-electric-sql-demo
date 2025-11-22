import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PayoffStrategyType } from '@/lib/universal/types';
import Decimal from 'decimal.js';
import { ArrowDownNarrowWide, ArrowUpNarrowWide, Info } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PayoffStrategyProps {
  strategy: PayoffStrategyType;
  onStrategyChange: (strategy: PayoffStrategyType) => void;
  totalMonthlyPayment: Decimal;
  onTotalMonthlyPaymentChange: (value: Decimal) => void;
  totalMinPayment: Decimal;
}

export function PayoffStrategy({
  strategy,
  onStrategyChange,
  totalMonthlyPayment,
  onTotalMonthlyPaymentChange,
  totalMinPayment,
}: PayoffStrategyProps) {
  // Local state to allow free typing without interference
  const [localValue, setLocalValue] = useState(totalMonthlyPayment.toFixed(2));
  const [isFocused, setIsFocused] = useState(false);

  // Sync local value when prop changes (but not while user is typing)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(totalMonthlyPayment.toFixed(2));
    }
  }, [totalMonthlyPayment, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalValue(value);
    // Update parent immediately for real-time calculations
    onTotalMonthlyPaymentChange(
      value === '' ? new Decimal(0) : new Decimal(value),
    );
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Ensure value is properly formatted on blur
    const numValue = localValue === '' ? 0 : Number(localValue);
    if (isNaN(numValue) || numValue < 0) {
      setLocalValue(totalMonthlyPayment.toFixed(2));
      onTotalMonthlyPaymentChange(totalMonthlyPayment);
    } else {
      setLocalValue(new Decimal(numValue).toFixed(2));
      onTotalMonthlyPaymentChange(new Decimal(numValue));
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mt-3">
      <div className="flex items-start gap-4">
        {/* Monthly Budget Input - Left Side */}
        <div className="flex-1 min-w-0">
          <label
            htmlFor="monthly-payment"
            className="text-[10px] font-semibold text-muted-foreground block mb-1.5"
          >
            Monthly Budget
          </label>
          <div className="relative group mb-1.5">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium group-focus-within:text-primary transition-colors text-sm">
              $
            </div>
            <input
              id="monthly-payment"
              type="number"
              step="0.01"
              min="0"
              value={localValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className="w-full pl-6 pr-3 py-2 bg-muted/30 border-0 rounded-xl text-base font-bold text-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-muted-foreground font-medium">
              Min: ${totalMinPayment.toFixed(0)}
            </p>
            {totalMonthlyPayment.gt(0) &&
              totalMonthlyPayment.lt(totalMinPayment) && (
                <p className="text-[10px] text-destructive font-bold bg-destructive/10 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  Too low
                </p>
              )}
          </div>
        </div>

        {/* Strategy Selector - Right Side */}
        <div className="w-[140px] flex-none">
          <div className="flex items-center gap-1 mb-1.5">
            <span className="text-[10px] font-semibold text-gray-400">
              Strategy
            </span>
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-gray-300 hover:text-gray-500 cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="max-w-[200px] text-xs p-3"
                >
                  {strategy === PayoffStrategyType.Avalanche
                    ? 'Avalanche focuses on highest interest rates first to save the most money on interest.'
                    : 'Snowball focuses on smallest balances first to build momentum with quick wins.'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => onStrategyChange(PayoffStrategyType.Avalanche)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all w-full text-left ${
                strategy === PayoffStrategyType.Avalanche
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
                  : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <ArrowDownNarrowWide
                className={`h-3.5 w-3.5 ${
                  strategy === PayoffStrategyType.Avalanche
                    ? 'text-indigo-500'
                    : 'text-gray-400'
                }`}
              />
              Avalanche
            </button>
            <button
              onClick={() => onStrategyChange(PayoffStrategyType.Snowball)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all w-full text-left ${
                strategy === PayoffStrategyType.Snowball
                  ? 'bg-indigo-50 border-indigo-100 text-indigo-700 shadow-sm'
                  : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <ArrowUpNarrowWide
                className={`h-3.5 w-3.5 ${
                  strategy === PayoffStrategyType.Snowball
                    ? 'text-indigo-500'
                    : 'text-gray-400'
                }`}
              />
              Snowball
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
