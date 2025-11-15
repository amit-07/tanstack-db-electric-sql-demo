import { Card, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkbookCard } from '@/components/WorkbookCard';
import { authClient, useSession } from '@/lib/client/auth-client';
import { workbooksCollection } from '@/lib/client/collections';
import { useLiveQuery } from '@tanstack/react-db';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useEffect } from 'react';
import { v7 as uuidv7 } from 'uuid';

export const Route = createFileRoute('/dashboard')({
  ssr: false,
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

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
    workbooksCollection.insert({
      id: uuidv7(),
      name: 'My Workbook',
      createdAt: new Date().toISOString(),
    });
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
            <WorkbookCard key={workbook.id} workbook={workbook} />
          ))}

          {/* New Workbook Button */}
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-2 border-dashed border-gray-300 bg-gray-50/50 hover:bg-gray-100/50 hover:border-gray-400 flex items-center justify-center"
            onClick={handleCreateWorkbook}
          >
            <div className="flex flex-col items-center gap-3 p-4">
              <div className="p-3 bg-gray-200/70 rounded-lg">
                <Plus className="h-8 w-8 text-gray-500" />
              </div>
              <div className="text-center">
                <CardTitle className="text-lg text-gray-600">
                  New Workbook
                </CardTitle>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
