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
import { authClient, useSession } from '@/lib/client/auth-client';
import { workbooksCollection } from '@/lib/client/collections';
import { createWorkbook } from '@/lib/functions/workbooks';
import { useLiveQuery } from '@tanstack/react-db';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BookOpen, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!isPending && !session) {
      navigate({ to: '/' });
    }
  }, [session, isPending, navigate]);

  const { data: workbooks } = useLiveQuery((q) =>
    q
      .from({ workbook: workbooksCollection })
      .orderBy(({ workbook }) => workbook.name),
  );

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: '/' });
  };

  const handleCreateWorkbook = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const { workbook } = await createWorkbook({ data: {} });
      navigate({ to: `/w/${workbook.id}` });
    } catch (error) {
      console.error('Failed to create workbook:', error);
      setIsCreating(false);
    }
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
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
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
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Workbooks
          </h2>
          <p className="text-gray-600">
            Manage your debt payoff strategies with workbooks
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workbooks.map((workbook) => (
            <Card
              key={workbook.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate({ to: `/w/${workbook.id}` })}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{workbook.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">
                        Created{' '}
                        {new Date(workbook.createdAt).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          },
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Debts</span>
                    <span className="font-medium">{5}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Balance</span>
                    <span className="font-medium">
                      $
                      {(50000).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New Workbook Button */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400 flex items-center justify-center min-h-[240px]"
            onClick={handleCreateWorkbook}
          >
            <div className="flex flex-col items-center gap-3 p-6">
              <div className="p-3 bg-gray-200/70 rounded-lg">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <div className="text-center">
                <CardTitle className="text-lg text-gray-600">
                  {isCreating ? 'Creating...' : 'New Workbook'}
                </CardTitle>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
