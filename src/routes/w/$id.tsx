import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { authClient, useSession } from '@/lib/client/auth-client';
import { debtsCollection } from '@/lib/client/collections';
import { PayoffCalculator, Debt } from '@/lib/universal/payoff';
import { DebtType, PayoffStrategyType } from '@/lib/universal/types';
import { Temporal } from '@js-temporal/polyfill';
import { eq, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Decimal from 'decimal.js';
import {
  Car,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Home,
  MoreVertical,
  Plus,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { v7 as uuidv7 } from 'uuid';

export const Route = createFileRoute('/w/$id')({
  ssr: false,
  component: WorkbookDetail,
});

interface DebtTypeOption {
  value: DebtType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const debtTypeOptions: DebtTypeOption[] = [
  { value: DebtType.Auto, label: 'Auto', icon: Car },
  { value: DebtType.Home, label: 'Home', icon: Home },
  { value: DebtType.Credit, label: 'Credit', icon: CreditCard },
  { value: DebtType.School, label: 'School', icon: GraduationCap },
  { value: DebtType.Personal, label: 'Personal', icon: User },
  { value: DebtType.Other, label: 'Other', icon: Wallet },
];

// Demo debt data template
// Credit cards use 1-2% of balance + interest for minimum payments
// Auto and home loans have fixed monthly payments
const demoDebtsTemplate = [
  {
    name: 'Credit Card - Chase',
    type: DebtType.Credit,
    rate: 18.99,
    balance: 15420.0,
    minPayment: 397.0, // ~2% of balance + interest (percentage-based)
  },
  {
    name: 'Student Loan',
    type: DebtType.School,
    rate: 4.5,
    balance: 32500.0,
    minPayment: 447.0, // ~1% of balance + interest (percentage-based)
  },
  {
    name: 'Car Loan',
    type: DebtType.Auto,
    rate: 6.25,
    balance: 8200.0,
    minPayment: 185.0, // Fixed monthly payment (installment loan)
  },
  {
    name: 'Credit Card - Discover',
    type: DebtType.Credit,
    rate: 24.99,
    balance: 3850.0,
    minPayment: 119.0, // ~2% of balance + interest (percentage-based)
  },
  {
    name: 'Personal Loan',
    type: DebtType.Personal,
    rate: 11.99,
    balance: 19500.0,
    minPayment: 390.0, // ~1.5% of balance + interest (percentage-based)
  },
];

function WorkbookDetail() {
  const navigate = useNavigate();
  const { id: workbookId } = Route.useParams();
  const { data: session, isPending } = useSession();

  // Load debts from the collection using live query
  const { data: allDebts } = useLiveQuery((q) =>
    q
      .from({ debt: debtsCollection })
      .where(({ debt }) => eq(debt.workbookId, workbookId))
      .orderBy(({ debt }) => debt.name),
  );

  // Filter debts by workbookId and ensure numeric fields are numbers
  const debts = allDebts
    .filter((debt) => debt.workbookId === workbookId)
    .map((debt) => ({
      ...debt,
      rate: new Decimal(debt.rate),
      balance: new Decimal(debt.balance),
      minPayment: new Decimal(debt.minPayment),
    }));

  // Payoff calculator state
  const [strategy, setStrategy] = useState<PayoffStrategyType>(
    PayoffStrategyType.Avalanche,
  );
  const [showAllMonths, setShowAllMonths] = useState(false);

  // Calculate total minimum payment
  const totalMinPayment = debts.reduce(
    (sum, debt) => sum.add(debt.minPayment),
    new Decimal(0),
  );

  // Default to total minimum payment
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState<string>('');

  // Update totalMonthlyPayment when totalMinPayment changes
  useEffect(() => {
    if (totalMinPayment.gt(0) && !totalMonthlyPayment) {
      setTotalMonthlyPayment(totalMinPayment.toFixed(2));
    }
  }, [totalMinPayment, totalMonthlyPayment]);

  // Calculate payoff schedule
  const payoffSchedule = useMemo(() => {
    if (debts.length === 0 || !totalMonthlyPayment) {
      return null;
    }

    const payment = new Decimal(totalMonthlyPayment || 0);
    if (payment.lt(totalMinPayment)) {
      return null;
    }

    // Convert debts to PayoffDebt format
    const payoffDebts = debts.map((d) => {
      // Auto and home loans have fixed payments, others are percentage-based
      const isFixedPayment =
        d.type === DebtType.Auto || d.type === DebtType.Home;

      return new Debt({
        id: d.id,
        name: d.name,
        startBalance: d.balance,
        rate: d.rate.div(100), // Convert percentage to decimal (e.g., 5.5% -> 0.055)
        fixedMinPayment: isFixedPayment ? d.minPayment : undefined,
      });
    });

    // Generate payoff schedule
    const calculator = new PayoffCalculator(payoffDebts, payment, strategy);
    return calculator.calculate();
  }, [debts, totalMonthlyPayment, strategy, totalMinPayment]);

  // Determine visible months for payoff table
  const visibleMonths = useMemo(() => {
    if (!payoffSchedule) return [];
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

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' });
    }
  }, [session, isPending, navigate]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: '/' });
  };

  const handlePopulateDemoDebts = () => {
    demoDebtsTemplate.forEach((debt) => {
      debtsCollection.insert({
        id: uuidv7(),
        workbookId,
        name: debt.name,
        type: debt.type,
        rate: debt.rate.toString(),
        minPayment: debt.minPayment.toString(),
        balance: debt.balance.toString(),
      });
    });
  };

  const handleTypeChange = (debtId: string, newType: DebtType) => {
    debtsCollection.update(debtId, (draft) => {
      draft.type = newType;
    });
  };

  const handleDeleteDebt = (debtId: string) => {
    debtsCollection.delete(debtId);
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const totalBalance = debts.reduce(
    (sum, debt) => sum.add(debt.balance),
    new Decimal(0),
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate({ to: '/dashboard' })}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                My Workbook
              </h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus:outline-none focus:ring-2 focus:ring-gray-200 rounded-full">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors">
                      <span className="text-gray-600 font-medium">
                        {session.user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Your Debts</CardTitle>
                <CardDescription>
                  Track and manage your debt payoff journey
                </CardDescription>
              </div>
              {debts.length === 0 && (
                <Button onClick={handlePopulateDemoDebts} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Demo Debts
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Debt Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Interest Rate</TableHead>
                  <TableHead className="text-right">Min Payment</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {debts.map((debt) => {
                  const currentType = debtTypeOptions.find(
                    (opt) => opt.value === debt.type,
                  );
                  const Icon = currentType?.icon || Wallet;

                  return (
                    <TableRow key={debt.id}>
                      <TableCell className="font-medium">{debt.name}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                              <Icon className="h-4 w-4 text-gray-600" />
                              <span className="text-sm">
                                {currentType?.label}
                              </span>
                              <ChevronDown className="h-3 w-3 text-gray-400" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            {debtTypeOptions.map((option) => {
                              const OptionIcon = option.icon;
                              return (
                                <DropdownMenuItem
                                  key={option.value}
                                  onClick={() =>
                                    handleTypeChange(debt.id, option.value)
                                  }
                                >
                                  <OptionIcon className="h-4 w-4 mr-2" />
                                  {option.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        {debt.rate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {debt.minPayment.toNumber().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {debt.balance.toNumber().toLocaleString('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
                              <MoreVertical className="h-4 w-4 text-gray-600" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDeleteDebt(debt.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold">
                    {totalMinPayment.toNumber().toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {totalBalance.toNumber().toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>

        {/* Payoff Strategy and Calculator */}
        {debts.length > 0 && (
          <>
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
                      onClick={() => setStrategy(PayoffStrategyType.Avalanche)}
                      className="flex-1"
                    >
                      Avalanche (Highest Rate First)
                    </Button>
                    <Button
                      variant={
                        strategy === PayoffStrategyType.Snowball
                          ? 'default'
                          : 'outline'
                      }
                      onClick={() => setStrategy(PayoffStrategyType.Snowball)}
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
                        value={totalMonthlyPayment}
                        onChange={(e) => setTotalMonthlyPayment(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                      />
                    </div>
                  </div>
                  {totalMonthlyPayment &&
                    new Decimal(totalMonthlyPayment || 0).lt(
                      totalMinPayment,
                    ) && (
                      <p className="text-sm text-red-600 mt-1">
                        Payment must be at least ${totalMinPayment.toFixed(2)}{' '}
                        (sum of minimum payments)
                      </p>
                    )}
                  <p className="text-sm text-gray-500 mt-1">
                    Minimum required: ${totalMinPayment.toFixed(2)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payoff Summary */}
            {payoffSchedule && (
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
                      <div className="text-sm text-gray-600 mb-1">
                        Debt-Free Date
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {Temporal.PlainYearMonth.from(
                          payoffSchedule.debtFreeDate,
                        )
                          .toPlainDate({ day: 1 })
                          .toLocaleString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">
                        Time to Payoff
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {payoffSchedule.monthsToPayoff}{' '}
                        {payoffSchedule.monthsToPayoff === 1
                          ? 'month'
                          : 'months'}
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
            )}

            {/* Payoff Table */}
            {payoffSchedule && (
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
                              <div className="text-xs font-semibold">
                                {debt.name}
                              </div>
                            </TableHead>
                          ))}
                          <TableHead className="text-center min-w-[120px] bg-gray-50">
                            <div className="text-xs font-semibold">
                              Total Debt
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleMonths.map((month) => {
                          const monthDate = Temporal.PlainYearMonth.from(
                            month.date,
                          );
                          const isJanuary =
                            monthDate.month === 1 && month.month > 0;
                          return (
                            <TableRow
                              key={month.month}
                              className={
                                isJanuary ? 'border-t-2 border-t-gray-900' : ''
                              }
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
                                  (payment.newBalance.eq(0) &&
                                    payment.payment.eq(0))
                                ) {
                                  return (
                                    <TableCell
                                      key={debt.id}
                                      className="text-center"
                                    >
                                      <div className="text-xs text-gray-400">
                                        Paid off
                                      </div>
                                    </TableCell>
                                  );
                                }
                                return (
                                  <TableCell
                                    key={debt.id}
                                    className="text-center"
                                  >
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
                        onClick={() => setShowAllMonths(!showAllMonths)}
                      >
                        {showAllMonths
                          ? 'Show Less'
                          : `Show All ${payoffSchedule.months.length} Months`}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </main>
    </div>
  );
}
