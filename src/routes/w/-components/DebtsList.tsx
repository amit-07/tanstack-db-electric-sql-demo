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
import { DebtType } from '@/lib/universal/types';
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
import React from 'react';

export interface WorkbookDebt {
  id: string;
  name: string;
  type: string; // stored as string in DB/collection but we treat as DebtType
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
  onDeleteDebt: (debtId: string) => void;
}

export function DebtsList({
  debts,
  onPopulateDemoDebts,
  onTypeChange,
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
            <Button onClick={onPopulateDemoDebts} variant="outline">
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
                          <span className="text-sm">{currentType?.label}</span>
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
                                onTypeChange(debt.id, option.value)
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
                          onClick={() => onDeleteDebt(debt.id)}
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
  );
}
