import { useSession } from '@/lib/client/auth-client';
import { debtsCollection, workbooksCollection } from '@/lib/client/collections';
import { populateDemoDebts } from '@/lib/client/demo-debts';
import { Debt, PayoffCalculator } from '@/lib/universal/payoff';
import { DebtType, PayoffStrategyType } from '@/lib/universal/types';
import { eq, useLiveQuery } from '@tanstack/react-db';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import Decimal from 'decimal.js';
import { useEffect, useMemo, useState } from 'react';
import { DebtsList } from './-components/DebtsList';
import { PayoffSchedule } from './-components/PayoffSchedule';
import { PayoffStrategy } from './-components/PayoffStrategy';
import { PayoffSummary } from './-components/PayoffSummary';
import { WorkbookNavBar } from './-components/WorkbookNavBar';

export const Route = createFileRoute('/w/$id')({
  ssr: false,
  component: WorkbookDetail,
});

function WorkbookDetail() {
  const navigate = useNavigate();
  const { id: workbookId } = Route.useParams();
  const { data: session, isPending } = useSession();

  const { data: workbook } = useLiveQuery((q) =>
    q
      .from({ workbook: workbooksCollection })
      .where(({ workbook }) => eq(workbook.id, workbookId))
      .findOne(),
  );

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

  // Default to total minimum payment
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState<Decimal>(
    new Decimal(0),
  );

  // Update totalMonthlyPayment when totalMinPayment changes
  const totalMinPayment = debts.reduce(
    (sum, debt) => sum.add(debt.minPayment),
    new Decimal(0),
  );
  useEffect(() => {
    // Only auto-update when totalMinPayment increases, not when user is typing
    if (totalMinPayment.gt(totalMonthlyPayment)) {
      setTotalMonthlyPayment(totalMinPayment);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalMinPayment]);

  // Calculate payoff schedule
  const payoffSchedule = useMemo(() => {
    if (debts.length === 0 || totalMonthlyPayment.eq(0)) {
      return null;
    }

    const payment = totalMonthlyPayment;
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

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' });
    }
  }, [session, isPending, navigate]);

  const handlePopulateDemoDebts = () => {
    populateDemoDebts(workbookId);
  };

  const handleTypeChange = (debtId: string, newType: DebtType) => {
    debtsCollection.update(debtId, (draft) => {
      draft.type = newType;
    });
  };

  const handleUpdateDebt = (
    debtId: string,
    field: 'name' | 'balance' | 'minPayment' | 'rate',
    value: string | number,
  ) => {
    debtsCollection.update(debtId, (draft) => {
      // Convert numeric values to strings for balance, rate, and minPayment
      // as the schema expects strings
      if (field === 'balance' || field === 'rate' || field === 'minPayment') {
        // @ts-ignore - dynamic assignment
        draft[field] = value.toString();
      } else {
        // @ts-ignore - dynamic assignment
        draft[field] = value;
      }
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

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <WorkbookNavBar user={session.user} workbook={workbook} />

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full">
          {/* Left Column: Data Entry */}
          <div className="lg:col-span-1 h-full flex flex-col min-h-0 bg-muted/30">
            <div className="flex-1 overflow-hidden min-h-0 pt-4 px-4 lg:pt-6 lg:px-6 pb-0.5">
              <div className="max-w-xl ml-auto mr-auto lg:mr-0 h-full">
                <DebtsList
                  debts={debts}
                  onPopulateDemoDebts={handlePopulateDemoDebts}
                  onTypeChange={handleTypeChange}
                  onUpdateDebt={handleUpdateDebt}
                  onDeleteDebt={handleDeleteDebt}
                />
              </div>
            </div>
            <div className="flex-none px-4 lg:px-6 pt-3 pb-4 lg:pb-6">
              <div className="max-w-xl ml-auto mr-auto lg:mr-0">
                <PayoffStrategy
                  strategy={strategy}
                  onStrategyChange={setStrategy}
                  totalMonthlyPayment={totalMonthlyPayment}
                  onTotalMonthlyPaymentChange={(value) =>
                    setTotalMonthlyPayment(value)
                  }
                  totalMinPayment={totalMinPayment}
                />
              </div>
            </div>
          </div>

          {/* Right Column: Stats & Visualization */}
          <div className="lg:col-span-2 h-full overflow-y-auto bg-background">
            <div className="p-6 lg:p-10 max-w-5xl space-y-6">
              {debts.length > 0 ? (
                <>
                  {/* Payoff Summary */}
                  {payoffSchedule && (
                    <PayoffSummary
                      payoffSchedule={payoffSchedule}
                    />
                  )}

                  {/* Payoff Table */}
                  {payoffSchedule && (
                    <PayoffSchedule
                      payoffSchedule={payoffSchedule}
                      debts={debts}
                      showAllMonths={showAllMonths}
                      onShowAllMonthsChange={setShowAllMonths}
                    />
                  )}
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/20 rounded-3xl border-2 border-dashed border-border">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Ready to be debt-free?
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    Add your debts on the left to generate your personalized
                    payoff plan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
