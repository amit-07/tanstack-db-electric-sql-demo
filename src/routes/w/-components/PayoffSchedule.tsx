import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PayoffScheduleResult } from '@/lib/universal/payoff';
import { PayoffStrategyType } from '@/lib/universal/types';
import { Temporal } from '@js-temporal/polyfill';
import { useMemo } from 'react';
import { WorkbookDebt } from './DebtsList';

interface PayoffScheduleProps {
  payoffSchedule: PayoffScheduleResult;
  debts: WorkbookDebt[];
  strategy: PayoffStrategyType;
  showAllMonths: boolean;
  onShowAllMonthsChange: (show: boolean) => void;
}

export function PayoffSchedule({
  payoffSchedule,
  debts,
  strategy,
  showAllMonths,
  onShowAllMonthsChange,
}: PayoffScheduleProps) {
  // Determine visible months for payoff table
  const visibleMonths = useMemo(() => {
    if (showAllMonths) return payoffSchedule.months;
    return payoffSchedule.months.slice(0, 24);
  }, [payoffSchedule, showAllMonths]);

  // Order debts based on strategy for table display
  const orderedDebts = useMemo(() => {
    if (strategy === PayoffStrategyType.Avalanche) {
      return [...debts].sort((a, b) => b.rate.cmp(a.rate));
    } else {
      return [...debts].sort((a, b) => a.balance.cmp(b.balance));
    }
  }, [debts, strategy]);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Month-by-Month Payoff Schedule</CardTitle>
        <CardDescription>
          Track your progress as you pay off each debt
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Month</TableHead>
                {orderedDebts.map((debt) => (
                  <TableHead
                    key={debt.id}
                    className="text-center min-w-[140px]"
                  >
                    <div className="text-xs font-semibold">{debt.name}</div>
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[120px] bg-gray-50">
                  <div className="text-xs font-semibold">Total Debt</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleMonths.map((month) => {
                const monthDate = Temporal.PlainYearMonth.from(month.date);
                const isJanuary = monthDate.month === 1 && month.month > 0;
                return (
                  <TableRow
                    key={month.month}
                    className={isJanuary ? 'border-t-2 border-t-gray-900' : ''}
                  >
                    <TableCell className="font-medium text-sm">
                      {monthDate
                        .toPlainDate({ day: 1 })
                        .toLocaleString('en-US', {
                          month: 'short',
                          year: 'numeric',
                        })}
                    </TableCell>
                    {orderedDebts.map((debt) => {
                      const payment = month.payments.find(
                        (p) => p.debtId === debt.id,
                      );
                      if (
                        !payment ||
                        (payment.newBalance.eq(0) && payment.payment.eq(0))
                      ) {
                        return (
                          <TableCell key={debt.id} className="text-center">
                            <div className="text-xs text-gray-400">
                              Paid off
                            </div>
                          </TableCell>
                        );
                      }
                      return (
                        <TableCell key={debt.id} className="text-center">
                          <div className="space-y-0.5">
                            <div
                              className={`text-xs ${
                                payment.isMinimum
                                  ? 'text-gray-400'
                                  : 'text-green-600'
                              }`}
                            >
                              {payment.isMinimum
                                ? 'Minimum'
                                : payment.payment
                                    .toNumber()
                                    .toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                            </div>
                            <div className="text-xs font-semibold text-gray-900">
                              {payment.newBalance
                                .toNumber()
                                .toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}
                            </div>
                          </div>
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center bg-gray-50">
                      <div className="text-sm font-bold text-gray-900">
                        {month.remainingBalance
                          .toNumber()
                          .toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0,
                          })}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Show More/Less Button */}
        {payoffSchedule.months.length > 24 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={() => onShowAllMonthsChange(!showAllMonths)}
            >
              {showAllMonths
                ? 'Show Less'
                : `Show All ${payoffSchedule.months.length} Months`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
