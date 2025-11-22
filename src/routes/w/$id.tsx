import { useSession } from '@/lib/client/auth-client';
import { debtsCollection } from '@/lib/client/collections';
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
    if (totalMinPayment.gt(totalMonthlyPayment)) {
      setTotalMonthlyPayment(totalMinPayment);
    }
  }, [totalMinPayment, totalMonthlyPayment]);

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
    <div className="min-h-screen bg-white">
      <WorkbookNavBar user={session.user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <DebtsList
          debts={debts}
          onPopulateDemoDebts={handlePopulateDemoDebts}
          onTypeChange={handleTypeChange}
          onDeleteDebt={handleDeleteDebt}
        />

        {/* Payoff Strategy and Calculator */}
        {debts.length > 0 && (
          <>
            <PayoffStrategy
              strategy={strategy}
              onStrategyChange={setStrategy}
              totalMonthlyPayment={totalMonthlyPayment}
              onTotalMonthlyPaymentChange={(value) =>
                setTotalMonthlyPayment(value)
              }
              totalMinPayment={totalMinPayment}
            />

            {/* Payoff Summary */}
            {payoffSchedule && (
              <PayoffSummary
                payoffSchedule={payoffSchedule}
                strategy={strategy}
              />
            )}

            {/* Payoff Table */}
            {payoffSchedule && (
              <PayoffSchedule
                payoffSchedule={payoffSchedule}
                debts={debts}
                strategy={strategy}
                showAllMonths={showAllMonths}
                onShowAllMonthsChange={setShowAllMonths}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
