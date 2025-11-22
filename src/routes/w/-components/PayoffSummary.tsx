import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Payoff Summary</CardTitle>
        <CardDescription>
          Your debt-free journey with the {strategy} strategy
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Debt-Free Date</div>
            <div className="text-2xl font-bold text-gray-900">
              {Temporal.PlainYearMonth.from(payoffSchedule.debtFreeDate)
                .toPlainDate({ day: 1 })
                .toLocaleString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Time to Payoff</div>
            <div className="text-2xl font-bold text-gray-900">
              {payoffSchedule.monthsToPayoff}{' '}
              {payoffSchedule.monthsToPayoff === 1 ? 'month' : 'months'}
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">
              Total Interest Paid
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {payoffSchedule.totalInterestPaid
                .toNumber()
                .toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
