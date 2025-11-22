import { Temporal } from '@js-temporal/polyfill';
import Decimal from 'decimal.js';
import { PayoffStrategyType } from './types';

const MIN_PAYMENT_THRESHOLD = 35;
const MAX_MONTHS = 360;

// Export types for UI
export interface MonthlyPayment {
  debtId: string;
  payment: Decimal;
  interest: Decimal;
  principal: Decimal;
  newBalance: Decimal;
  isMinimum: boolean;
}

export interface MonthlySchedule {
  month: number;
  date: string;
  payments: MonthlyPayment[];
  totalPayment: Decimal;
  totalInterest: Decimal;
  remainingBalance: Decimal;
}

export interface PayoffScheduleResult {
  strategy: PayoffStrategyType;
  totalMonthlyPayment: Decimal;
  months: MonthlySchedule[];
  totalInterestPaid: Decimal;
  debtFreeDate: string;
  monthsToPayoff: number;
}

export interface DebtProps {
  id: string;
  name: string;
  startBalance: Decimal;
  rate: Decimal; // 1% = 0.01
  fixedMinPayment?: Decimal; // For installment loans (auto, home)
}

export class Debt {
  public readonly id: string;
  public readonly name: string;
  public readonly startBalance: Decimal;
  public readonly rate: Decimal;
  public readonly fixedMinPayment?: Decimal;

  constructor(props: DebtProps) {
    this.id = props.id;
    this.name = props.name;
    this.startBalance = props.startBalance;
    this.rate = props.rate;
    this.fixedMinPayment = props.fixedMinPayment;
  }

  // Calculate minimum payment based on debt type
  // For installment loans: Fixed payment
  // For revolving credit: Greater of $35 or 1% of balance + interest
  public getMinPayment(balance: Decimal, interest: Decimal): Decimal {
    if (balance.lte(0)) return new Decimal(0);

    if (this.fixedMinPayment) {
      return Decimal.min(balance.plus(interest), this.fixedMinPayment);
    }

    return Decimal.max(
      Decimal.min(balance, MIN_PAYMENT_THRESHOLD),
      balance.mul(0.01).plus(interest),
    );
  }
}

class PaymentCell {
  public readonly startBalance: Decimal;
  public readonly interest: Decimal;
  public readonly minPayment: Decimal;
  public payment: Decimal;

  constructor(
    public readonly debt: Debt,
    priorCell?: PaymentCell,
  ) {
    this.startBalance = priorCell ? priorCell.endBalance : debt.startBalance;

    // Monthly interest calculation
    this.interest = this.startBalance.mul(debt.rate.div(12));

    // Calculate minimum payment required
    this.minPayment = debt.getMinPayment(this.startBalance, this.interest);

    // Initial payment is just the minimum
    this.payment = this.minPayment;

    // If min payment covers full balance, zero out interest (payoff today)
    // logic: if we pay full balance, we pay full balance + accrued interest up to now?
    // The original logic was: if payment >= startBalance, interest = 0.
    // This implies if you pay it off, you don't pay interest? That's slightly inaccurate for trailing interest,
    // but acceptable for simple projection. I'll keep similar logic but clearer.
    if (this.payment.gte(this.startBalance.plus(this.interest))) {
      this.payment = this.startBalance.plus(this.interest);
    }
  }

  get endBalance(): Decimal {
    return Decimal.max(
      new Decimal(0),
      this.startBalance.plus(this.interest).minus(this.payment),
    );
  }

  get principal(): Decimal {
    return Decimal.max(0, this.payment.minus(this.interest));
  }

  isMinPayment(): boolean {
    // It's a minimum payment if it matches minPayment AND we aren't just clearing the final balance
    return this.payment.eq(this.minPayment) && this.endBalance.gt(0);
  }

  // Add extra payment to this cell
  addPayment(amount: Decimal): Decimal {
    const maxPayment = this.startBalance.plus(this.interest);
    const availableRoom = maxPayment.minus(this.payment);
    const actualAdd = Decimal.min(amount, availableRoom);

    this.payment = this.payment.plus(actualAdd);
    return amount.minus(actualAdd); // Return remaining amount
  }
}

class Period {
  public readonly cells: PaymentCell[];

  constructor(
    public readonly month: Temporal.PlainYearMonth,
    cells: PaymentCell[],
  ) {
    this.cells = cells;
  }

  static createFirst(
    debts: Debt[],
    startDate: Temporal.PlainYearMonth,
  ): Period {
    const cells = debts.map((d) => new PaymentCell(d));
    return new Period(startDate, cells);
  }

  createNext(): Period {
    const nextCells = this.cells.map(
      (cell) => new PaymentCell(cell.debt, cell),
    );
    return new Period(this.month.add({ months: 1 }), nextCells);
  }

  get totalMinPayment(): Decimal {
    return Decimal.sum(...this.cells.map((c) => c.minPayment));
  }

  get totalPayment(): Decimal {
    return Decimal.sum(...this.cells.map((c) => c.payment));
  }

  get totalInterest(): Decimal {
    return Decimal.sum(...this.cells.map((c) => c.interest));
  }

  get remainingBalance(): Decimal {
    return Decimal.sum(...this.cells.map((c) => c.endBalance));
  }
}

export class PayoffCalculator {
  constructor(
    private debts: Debt[],
    private totalMonthlyPayment: Decimal,
    private strategy: PayoffStrategyType = PayoffStrategyType.Avalanche,
    private startDate: Temporal.PlainYearMonth = Temporal.Now.plainDateISO().toPlainYearMonth(),
  ) {}

  public calculate(): PayoffScheduleResult {
    const periods: Period[] = [];

    // Initialize first period
    let currentPeriod = Period.createFirst(this.debts, this.startDate);

    // Distribute payments for first period
    this.distributePayments(currentPeriod);
    periods.push(currentPeriod);

    // Simulation loop
    while (
      currentPeriod.remainingBalance.gt(0) &&
      periods.length < MAX_MONTHS
    ) {
      currentPeriod = currentPeriod.createNext();
      this.distributePayments(currentPeriod);
      periods.push(currentPeriod);
    }

    return this.formatResult(periods);
  }

  private distributePayments(period: Period) {
    // 1. Calculate available extra money (Total Budget - Sum of Minimums)
    // Note: The cells are initialized with minPayment already.
    let extraMoney = Decimal.max(
      0,
      this.totalMonthlyPayment.minus(period.totalMinPayment),
    );

    if (extraMoney.lte(0)) return;

    // 2. Sort debts by strategy
    const sortedCells = [...period.cells].filter((c) => c.startBalance.gt(0));

    if (this.strategy === PayoffStrategyType.Avalanche) {
      // Highest rate first
      sortedCells.sort((a, b) => b.debt.rate.cmp(a.debt.rate));
    } else {
      // Lowest balance first (Snowball)
      sortedCells.sort((a, b) => a.startBalance.cmp(b.startBalance));
    }

    // 3. Apply extra payments
    for (const cell of sortedCells) {
      if (extraMoney.lte(0)) break;
      extraMoney = cell.addPayment(extraMoney);
    }
  }

  private formatResult(periods: Period[]): PayoffScheduleResult {
    const totalInterestPaid = Decimal.sum(
      ...periods.map((p) => p.totalInterest),
    );
    const finalPeriod = periods[periods.length - 1];

    const months: MonthlySchedule[] = periods.map((p, idx) => ({
      month: idx,
      date: p.month.toString(),
      payments: p.cells.map((c) => ({
        debtId: c.debt.id,
        payment: c.payment,
        interest: c.interest,
        principal: c.principal,
        newBalance: c.endBalance,
        isMinimum: c.isMinPayment(),
      })),
      totalPayment: p.totalPayment,
      totalInterest: p.totalInterest,
      remainingBalance: p.remainingBalance,
    }));

    return {
      strategy: this.strategy,
      totalMonthlyPayment: this.totalMonthlyPayment,
      months,
      totalInterestPaid,
      debtFreeDate: finalPeriod.month.toString(),
      monthsToPayoff: periods.length,
    };
  }
}
