import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PayoffStrategyType } from '@/lib/universal/types';
import Decimal from 'decimal.js';

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
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Payoff Strategy</CardTitle>
        <CardDescription>
          Choose a strategy and set your monthly payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Strategy Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Strategy
          </label>
          <div className="flex gap-2">
            <Button
              variant={
                strategy === PayoffStrategyType.Avalanche
                  ? 'default'
                  : 'outline'
              }
              onClick={() => onStrategyChange(PayoffStrategyType.Avalanche)}
              className="flex-1"
            >
              Avalanche (Highest Rate First)
            </Button>
            <Button
              variant={
                strategy === PayoffStrategyType.Snowball ? 'default' : 'outline'
              }
              onClick={() => onStrategyChange(PayoffStrategyType.Snowball)}
              className="flex-1"
            >
              Snowball (Lowest Balance First)
            </Button>
          </div>
        </div>

        {/* Monthly Payment Input */}
        <div>
          <label
            htmlFor="monthly-payment"
            className="text-sm font-medium text-gray-700 mb-2 block"
          >
            Total Monthly Payment
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <input
                id="monthly-payment"
                type="number"
                step="0.01"
                min="0"
                value={totalMonthlyPayment.toFixed(2)}
                onChange={(e) => {
                  const value = e.target.value;
                  onTotalMonthlyPaymentChange(
                    value === '' ? new Decimal(0) : new Decimal(value),
                  );
                }}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
          {totalMonthlyPayment.gt(0) &&
            totalMonthlyPayment.lt(totalMinPayment) && (
              <p className="text-sm text-red-600 mt-1">
                Payment must be at least ${totalMinPayment.toFixed(2)} (sum of
                minimum payments)
              </p>
            )}
          <p className="text-sm text-gray-500 mt-1">
            Minimum required: ${totalMinPayment.toFixed(2)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
