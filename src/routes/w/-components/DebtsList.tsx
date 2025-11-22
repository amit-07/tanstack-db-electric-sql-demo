import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DebtType } from '@/lib/universal/types';
import Decimal from 'decimal.js';
import {
  Car,
  CreditCard,
  GraduationCap,
  Home,
  MoreHorizontal,
  Plus,
  Trash2,
  User,
  Wallet,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

export interface WorkbookDebt {
  id: string;
  name: string;
  type: string;
  rate: Decimal;
  balance: Decimal;
  minPayment: Decimal;
}

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

interface DebtsListProps {
  debts: WorkbookDebt[];
  onPopulateDemoDebts: () => void;
  onTypeChange: (debtId: string, newType: DebtType) => void;
  onUpdateDebt: (
    debtId: string,
    field: 'name' | 'balance' | 'minPayment' | 'rate',
    value: string | number,
  ) => void;
  onDeleteDebt: (debtId: string) => void;
}

const EditableCell = ({
  value,
  onSave,
  type = 'text',
  prefix,
  suffix,
  className = '',
}: {
  value: string | number;
  onSave: (val: string | number) => void;
  type?: 'text' | 'number';
  prefix?: string;
  suffix?: string;
  className?: string;
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (localValue !== value) {
      onSave(type === 'number' ? Number(localValue) : localValue);
    }
  };

  return (
    <div className={`flex items-center group ${className}`}>
      {prefix && (
        <span className="text-muted-foreground text-xs mr-1 select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        className={`bg-transparent border-none p-0 h-auto focus:ring-0 w-full text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none min-w-[20px]`}
      />
      {suffix && (
        <span className="text-muted-foreground text-xs ml-0.5 select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};

export function DebtsList({
  debts,
  onPopulateDemoDebts,
  onTypeChange,
  onUpdateDebt,
  onDeleteDebt,
}: DebtsListProps) {
  const totalMinPayment = debts.reduce(
    (sum, debt) => sum.add(debt.minPayment),
    new Decimal(0),
  );
  const totalBalance = debts.reduce(
    (sum, debt) => sum.add(debt.balance),
    new Decimal(0),
  );

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl border border-border shadow-sm mb-1">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30 rounded-t-2xl">
        <h2 className="text-lg font-semibold text-foreground">Debts</h2>
        {debts.length === 0 && (
          <Button
            onClick={onPopulateDemoDebts}
            variant="outline"
            size="sm"
            className="h-8 text-xs"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add Demo Data
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-0">
        {debts.map((debt, index) => {
          const currentType = debtTypeOptions.find(
            (opt) => opt.value === debt.type,
          );
          const Icon = currentType?.icon || Wallet;

          return (
            <div
              key={debt.id}
              className={`group relative bg-card p-4 hover:bg-muted/30 transition-all ${
                index !== debts.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              {/* Top Row: Icon, Name, Actions */}
              <div className="flex items-center gap-3 mb-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none"
                      title={currentType?.label}
                    >
                      <Icon className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="rounded-xl border-border shadow-lg"
                  >
                    {debtTypeOptions.map((option) => {
                      const OptionIcon = option.icon;
                      return (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => onTypeChange(debt.id, option.value)}
                        >
                          <OptionIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                          {option.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="flex-1 min-w-0">
                  <EditableCell
                    value={debt.name}
                    onSave={(val) =>
                      onUpdateDebt(debt.id, 'name', val as string)
                    }
                    className="text-base font-semibold text-foreground"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="rounded-xl border-border shadow-lg"
                  >
                    <DropdownMenuItem
                      onClick={() => onDeleteDebt(debt.id)}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Debt
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Bottom Row: Values */}
              <div className="grid grid-cols-3 gap-4 pl-11">
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                    Balance
                  </div>
                  <EditableCell
                    value={debt.balance.toNumber()}
                    type="number"
                    prefix="$"
                    onSave={(val) =>
                      onUpdateDebt(debt.id, 'balance', val as number)
                    }
                    className="text-sm text-foreground/80"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                    Rate
                  </div>
                  <EditableCell
                    value={debt.rate.toNumber()}
                    type="number"
                    suffix="%"
                    onSave={(val) =>
                      onUpdateDebt(debt.id, 'rate', val as number)
                    }
                    className="text-sm text-foreground/80"
                  />
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground mb-0.5">
                    Min Pay
                  </div>
                  <EditableCell
                    value={debt.minPayment.toNumber()}
                    type="number"
                    prefix="$"
                    onSave={(val) =>
                      onUpdateDebt(debt.id, 'minPayment', val as number)
                    }
                    className="text-sm text-foreground/80"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
            <p className="text-sm">No debts added yet</p>
          </div>
        )}
      </div>

      {debts.length > 0 && (
        <div className="bg-muted/20 border-t border-border p-4 rounded-b-2xl">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-muted-foreground">Total</span>
            <div className="flex gap-6">
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-muted-foreground">
                  Balance
                </span>
                <span className="font-bold text-foreground">
                  {totalBalance.toNumber().toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-[10px] font-semibold text-muted-foreground">
                  Min Pay
                </span>
                <span className="font-bold text-foreground">
                  {totalMinPayment.toNumber().toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
