import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient, useSession } from '@/lib/client/auth-client'
import { useEffect } from 'react'

export const Route = createFileRoute('/dashboard')({ component: Dashboard })

// Demo debt data
const demoDebts = [
  {
    id: 1,
    name: 'Credit Card - Chase',
    interestRate: 18.99,
    minPayment: 150.0,
    balance: 5420.0,
  },
  {
    id: 2,
    name: 'Student Loan',
    interestRate: 4.5,
    minPayment: 250.0,
    balance: 28500.0,
  },
  {
    id: 3,
    name: 'Car Loan',
    interestRate: 6.25,
    minPayment: 425.0,
    balance: 18200.0,
  },
  {
    id: 4,
    name: 'Credit Card - Discover',
    interestRate: 21.49,
    minPayment: 85.0,
    balance: 2850.0,
  },
  {
    id: 5,
    name: 'Personal Loan',
    interestRate: 9.99,
    minPayment: 200.0,
    balance: 8500.0,
  },
]

function Dashboard() {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' })
    }
  }, [session, isPending, navigate])

  const handleSignOut = async () => {
    await authClient.signOut()
    navigate({ to: '/' })
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

  const totalMinPayment = demoDebts.reduce(
    (sum, debt) => sum + debt.minPayment,
    0,
  )
  const totalBalance = demoDebts.reduce((sum, debt) => sum + debt.balance, 0)

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Debt Payoff Calculator
            </h1>
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
                  <TableHead className="text-right">Interest Rate</TableHead>
                  <TableHead className="text-right">Min Payment</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demoDebts.map((debt) => (
                  <TableRow key={debt.id}>
                    <TableCell className="font-medium">{debt.name}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Total</TableCell>
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
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
