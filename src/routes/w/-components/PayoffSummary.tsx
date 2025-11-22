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
      <Card className="border-0 bg-linear-to-br from-indigo-500 to-purple-600 text-white rounded-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-black/10 rounded-full blur-xl"></div>
        <CardContent className="px-6 py-4 relative z-10">
          <div className="text-indigo-100 text-sm font-medium mb-1">
            Debt Free By
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {Temporal.PlainYearMonth.from(payoffSchedule.debtFreeDate)
              .toPlainDate({ day: 1 })
              .toLocaleString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
          </div>
          <div className="mt-1 text-indigo-200 text-sm font-medium">
            Using {strategy} strategy
          </div>
        </CardContent>
      </Card>

      {/* Time to Payoff */}
      <Card className="border border-border shadow-none bg-card rounded-2xl overflow-hidden">
        <CardContent className="px-6 py-4">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Time to Payoff
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">
            {payoffSchedule.monthsToPayoff}{' '}
            <span className="text-lg text-muted-foreground font-medium">
              {payoffSchedule.monthsToPayoff === 1 ? 'month' : 'months'}
            </span>
          </div>
          <div className="mt-1 text-green-600 text-sm font-medium flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
            On track
          </div>
        </CardContent>
      </Card>

      {/* Total Interest */}
      <Card className="border border-border shadow-none bg-card rounded-2xl overflow-hidden">
        <CardContent className="px-6 py-4">
          <div className="text-muted-foreground text-sm font-medium mb-1">
            Total Interest
          </div>
          <div className="text-3xl font-bold text-foreground tracking-tight">
            {payoffSchedule.totalInterestPaid
              .toNumber()
              .toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0,
              })}
          </div>
          <div className="mt-1 text-muted-foreground text-sm font-medium">
            Estimated cost
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
