import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { authClient, useSession } from '@/lib/client/auth-client'
import { DebtType } from '@/lib/universal/types'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Car,
  ChevronDown,
  CreditCard,
  GraduationCap,
  Home,
  MoreVertical,
  Trash2,
  User,
  Wallet,
} from 'lucide-react'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/w/$id')({ component: WorkbookDetail })

interface DebtTypeOption {
  value: DebtType
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const debtTypeOptions: DebtTypeOption[] = [
  { value: DebtType.Auto, label: 'Auto', icon: Car },
  { value: DebtType.Home, label: 'Home', icon: Home },
  { value: DebtType.Credit, label: 'Credit', icon: CreditCard },
  { value: DebtType.School, label: 'School', icon: GraduationCap },
  { value: DebtType.Personal, label: 'Personal', icon: User },
  { value: DebtType.Other, label: 'Other', icon: Wallet },
]

// Demo debt data
const initialDemoDebts = [
  {
    id: 1,
    name: 'Credit Card - Chase',
    type: DebtType.Credit,
    interestRate: 18.99,
    minPayment: 150.0,
    balance: 5420.0,
  },
  {
    id: 2,
    name: 'Student Loan',
    type: DebtType.School,
    interestRate: 4.5,
    minPayment: 250.0,
    balance: 28500.0,
  },
  {
    id: 3,
    name: 'Car Loan',
    type: DebtType.Auto,
    interestRate: 6.25,
    minPayment: 425.0,
    balance: 18200.0,
  },
  {
    id: 4,
    name: 'Credit Card - Discover',
    type: DebtType.Credit,
    interestRate: 21.49,
    minPayment: 85.0,
    balance: 2850.0,
  },
  {
    id: 5,
    name: 'Personal Loan',
    type: DebtType.Personal,
    interestRate: 9.99,
    minPayment: 200.0,
    balance: 8500.0,
  },
]

function WorkbookDetail() {
  const navigate = useNavigate()
  // const { id } = Route.useParams() // TODO: Use this to fetch workbook data
  const { data: session, isPending } = useSession()
  const [debts, setDebts] = useState(initialDemoDebts)

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' })
    }
  }, [session, isPending, navigate])

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
  }

  const handleTypeChange = (debtId: number, newType: DebtType) => {
    setDebts((prevDebts) =>
      prevDebts.map((debt) =>
        debt.id === debtId ? { ...debt, type: newType } : debt,
      ),
    )
  }

  const handleDeleteDebt = (debtId: number) => {
    // TODO: Implement delete functionality
    console.log('Delete debt:', debtId)
  }

  if (isPending) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600 text-xl">Loading...</p>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const totalMinPayment = debts.reduce((sum, debt) => sum + debt.minPayment, 0)
  const totalBalance = debts.reduce((sum, debt) => sum + debt.balance, 0)

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
            <CardTitle>Your Debts</CardTitle>
            <CardDescription>
              Track and manage your debt payoff journey
            </CardDescription>
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
                  )
                  const Icon = currentType?.icon || Wallet

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
                              const OptionIcon = option.icon
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
                              )
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="text-right">
                        {debt.interestRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">
                        ${debt.minPayment.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        $
                        {debt.balance.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
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
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell className="text-right font-bold">
                    ${totalMinPayment.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    $
                    {totalBalance.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
