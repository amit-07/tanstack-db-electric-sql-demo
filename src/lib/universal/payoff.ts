import { Temporal } from '@js-temporal/polyfill';
import Decimal from 'decimal.js';

// TODO: Add support for custom total monthly payment (distribute extra payment across debts)
// TODO: Add Snowball optimizer (lowest balance first strategy)
// TODO: Add support for fixed minimum payments (auto/home loans) instead of just percentage-based
// TODO: Add debt name property for display purposes
// TODO: Implement the optimize() method in AvalancheOptimizer to distribute extra payments
// TODO: Add method to export schedule in format expected by UI (with debtFreeDate, monthsToPayoff, totalInterestPaid, months array)
// TODO: Add support for custom start date (currently uses Temporal.Now)

const MIN_PAYMENT_THRESHOLD = 35;

export class Debt {
  public readonly id: string;
  public readonly name: string;
  public readonly startBalance: Decimal;
  public readonly rate: Decimal; // 1% = 0.01
  public readonly fixedMinPayment?: Decimal; // For installment loans (auto, home)

  constructor(attrs: {
    id: string;
    name: string;
    startBalance: Decimal;
    rate: Decimal;
    fixedMinPayment?: Decimal;
  }) {
    this.id = attrs.id;
    this.name = attrs.name;
    this.startBalance = attrs.startBalance;
    this.rate = attrs.rate;
    this.fixedMinPayment = attrs.fixedMinPayment;
  }

  // Use the greater of:
  // 1.	$35 (or the full balance if under $35), OR
  // 2.	1% of the statement balance + monthly interest + fees
  // OR fixed payment if specified (for installment loans)
  public calcMinPayment(balance: Decimal, interest: Decimal) {
    if (balance.lte(0)) return new Decimal(0);

    // For installment loans with fixed payments
    if (this.fixedMinPayment) {
      return Decimal.min(balance.plus(interest), this.fixedMinPayment);
    }

    // For revolving credit
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

  private _payment: Decimal;

  constructor(
    public debt: Debt,
    priorPeriod?: PaymentCell,
  ) {
    this.startBalance = priorPeriod?.endBalance || debt.startBalance;

    this.interest = this.startBalance.mul(debt.rate.div(12));
    this.minPayment = debt.calcMinPayment(this.startBalance, this.interest);
    this._payment = this.minPayment;
    if (this._payment.gte(this.startBalance)) this.interest = Decimal(0);
  }

  get payment() {
    return this._payment;
  }

  set payment(value: Decimal) {
    this._payment = Decimal.min(value, this.startBalance.plus(this.interest));
  }

  get endBalance(): Decimal {
    return Decimal.max(
      new Decimal(0),
      this.startBalance.plus(this.interest).minus(this._payment),
    );
  }

  isFinalPayment() {
    return this._payment.gt(0) && this.endBalance.eq(0);
  }

  isMinPayment() {
    return (
      this._payment.gt(0) &&
      this._payment.eq(this.minPayment) &&
      !this.endBalance.eq(0)
    );
  }

  get principal(): Decimal {
    return this._payment.minus(this.interest);
  }
}

class Period {
  public readonly cells: PaymentCell[];

  constructor(
    public month: Temporal.PlainYearMonth,
    cells: PaymentCell[],
  ) {
    this.cells = cells;
  }

  static initialize(
    debts: Debt[],
    startDate?: Temporal.PlainYearMonth,
  ): Period {
    const cells = debts.map((debt) => new PaymentCell(debt));
    const date = startDate || Temporal.Now.plainDateISO().toPlainYearMonth();
    return new Period(date, cells);
  }

  public nextPeriod(): Period {
    const cells = this.cells.map((cell) => new PaymentCell(cell.debt, cell));
    return new Period(this.month.add({ months: 1 }), cells);
  }

  public remainingBalance(): Decimal {
    return Decimal.sum(...this.cells.map((cell) => cell.endBalance));
  }

  public totalMinPayment(): Decimal {
    return Decimal.sum(...this.cells.map((cell) => cell.minPayment));
  }

  public totalPayment(): Decimal {
    return Decimal.sum(...this.cells.map((cell) => cell.payment));
  }

  public totalInterest(): Decimal {
    return Decimal.sum(...this.cells.map((cell) => cell.interest));
  }
}

abstract class Optimizer {
  constructor(
    protected debts: Debt[],
    protected totalMonthlyPayment: Decimal,
  ) {}

  abstract optimize(period: Period): void;

  protected distributeExtraPayment(
    period: Period,
    orderedCells: PaymentCell[],
  ) {
    // Calculate how much extra payment we have available
    let extraPayment = this.totalMonthlyPayment.minus(period.totalMinPayment());

    // Distribute extra payment to debts in priority order
    for (const cell of orderedCells) {
      if (extraPayment.lte(0)) break;
      if (cell.endBalance.lte(0)) continue;

      const maxAdditional = cell.endBalance.minus(
        cell.minPayment.minus(cell.interest),
      );
      const additionalPayment = Decimal.min(extraPayment, maxAdditional);

      cell.payment = cell.minPayment.plus(additionalPayment);
      extraPayment = extraPayment.minus(additionalPayment);
    }
  }
}

export class AvalancheOptimizer extends Optimizer {
  constructor(debts: Debt[], totalMonthlyPayment: Decimal) {
    super(debts, totalMonthlyPayment);
  }

  optimize(period: Period): void {
    // Sort cells by rate (highest first)
    const orderedCells = [...period.cells]
      .filter((cell) => cell.startBalance.gt(0))
      .sort((a, b) => b.debt.rate.cmp(a.debt.rate));

    this.distributeExtraPayment(period, orderedCells);
  }
}

export class SnowballOptimizer extends Optimizer {
  constructor(debts: Debt[], totalMonthlyPayment: Decimal) {
    super(debts, totalMonthlyPayment);
  }

  optimize(period: Period): void {
    // Sort cells by balance (lowest first)
    const orderedCells = [...period.cells]
      .filter((cell) => cell.startBalance.gt(0))
      .sort((a, b) => a.startBalance.cmp(b.startBalance));

    this.distributeExtraPayment(period, orderedCells);
  }
}

const MAX_MONTHS = 360;

export class Schedule {
  public readonly periods: Period[];

  constructor(
    public debts: Debt[],
    optimizer: Optimizer,
    startDate?: Temporal.PlainYearMonth,
  ) {
    this.periods = [Period.initialize(debts, startDate)];
    for (let i = 0; i < MAX_MONTHS - 1; i++) {
      const lastPeriod = this.periods.at(-1)!;
      if (lastPeriod.remainingBalance().eq(0)) break;

      const nextPeriod = lastPeriod.nextPeriod();
      optimizer.optimize(nextPeriod);
      this.periods.push(nextPeriod);
    }
  }

  public toPayoffSchedule(strategyType: string): PayoffScheduleResult {
    const debtFreeDate = this.periods.at(-1)!.month.toString();
    const monthsToPayoff = this.periods.length;

    const totalInterestPaid = Decimal.sum(
      ...this.periods.map((p) => p.totalInterest()),
    );

    const months = this.periods.map((period, index) => ({
      month: index,
      date: period.month.toString(),
      payments: period.cells.map((cell) => ({
        debtId: cell.debt.id,
        payment: cell.payment,
        interest: cell.interest,
        principal: cell.principal,
        newBalance: cell.endBalance,
        isMinimum: cell.isMinPayment(),
      })),
      totalPayment: period.totalPayment(),
      totalInterest: period.totalInterest(),
      remainingBalance: period.remainingBalance(),
    }));

    return {
      strategy: strategyType,
      totalMonthlyPayment: this.periods[0].totalPayment(),
      months,
      totalInterestPaid,
      debtFreeDate,
      monthsToPayoff,
    };
  }
}

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
  strategy: string;
  totalMonthlyPayment: Decimal;
  months: MonthlySchedule[];
  totalInterestPaid: Decimal;
  debtFreeDate: string;
  monthsToPayoff: number;
}
