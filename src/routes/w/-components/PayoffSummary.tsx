import { Card, CardContent } from '@/components/ui/card';
import { PayoffScheduleResult } from '@/lib/universal/payoff';
import { PayoffStrategyType } from '@/lib/universal/types';
import { Temporal } from '@js-temporal/polyfill';

interface PayoffSummaryProps {
  payoffSchedule: PayoffScheduleResult;
  strategy: PayoffStrategyType;
}

export function PayoffSummary({
  payoffSchedule,
  strategy,
}: PayoffSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Debt Free Date */}
      <Card className="border-0 shadow-sm bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
        <CardContent className="px-6 py-3 relative z-10">
          <div className="text-indigo-100 text-xs font-semibold mb-0.5">
            Debt Free By
          </div>
          <div className="text-3xl font-bold">
            {Temporal.PlainYearMonth.from(payoffSchedule.debtFreeDate)
              .toPlainDate({ day: 1 })
              .toLocaleString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
          </div>
          <div className="mt-0.5 text-indigo-200 text-sm font-medium">
            Using {strategy} strategy
          </div>
        </CardContent>
      </Card>

      {/* Time to Payoff */}
      <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="px-6 py-3">
          <div className="text-gray-400 text-xs font-semibold mb-0.5">
            Time to Payoff
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {payoffSchedule.monthsToPayoff}{' '}
            <span className="text-lg text-gray-400 font-medium">
              {payoffSchedule.monthsToPayoff === 1 ? 'month' : 'months'}
            </span>
          </div>
          <div className="mt-0.5 text-green-600 text-sm font-medium flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            On track
          </div>
        </CardContent>
      </Card>

      {/* Total Interest */}
      <Card className="border-0 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="px-6 py-3">
          <div className="text-gray-400 text-xs font-semibold mb-0.5">
            Total Interest
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {payoffSchedule.totalInterestPaid
              .toNumber()
              .toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}
          </div>
          <div className="mt-0.5 text-gray-400 text-sm font-medium">
            Estimated cost
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
