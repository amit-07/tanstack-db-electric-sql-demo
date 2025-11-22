import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/client/auth-client';
import { workbooksCollection } from '@/lib/client/collections';
import { useNavigate } from '@tanstack/react-router';
import type { User } from 'better-auth/types';
import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface WorkbookNavBarProps {
  user: User;
  workbook?: { id: string; name: string; createdAt: string };
}

export function WorkbookNavBar({ user, workbook }: WorkbookNavBarProps) {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(workbook?.name || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (workbook?.name) {
      setEditedName(workbook.name);
    }
  }, [workbook?.name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: '/' });
  };

  const handleSaveName = () => {
    if (workbook && editedName.trim() && editedName !== workbook.name) {
      workbooksCollection.update(workbook.id, (draft) => {
        draft.name = editedName.trim();
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setEditedName(workbook?.name || '');
      setIsEditing(false);
    }
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate({ to: '/dashboard' })}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Dash
            </button>
            <div className="h-6 w-px bg-border"></div>
            <div
              className="relative group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isEditing ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  maxLength={48}
                  className="text-xl font-bold text-foreground tracking-tight bg-transparent border-b-2 border-blue-500 outline-none px-1 -mx-1"
                  style={{
                    width: `${Math.max(editedName.length * 12, 120)}px`,
                  }}
                />
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`text-xl font-bold text-foreground tracking-tight flex items-center gap-2 px-1 -mx-1 transition-all border-b-2 ${
                    isHovered ? 'border-border' : 'border-transparent'
                  }`}
                >
                  <span>{workbook?.name || 'Payoff Plan'}</span>
                  {isHovered && (
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring/20 rounded-full transition-all">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-9 h-9 rounded-full cursor-pointer hover:opacity-90 shadow-sm border border-white"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center cursor-pointer hover:shadow-md transition-shadow text-white shadow-sm border border-white">
                    <span className="font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 rounded-xl border-border shadow-lg shadow-black/5 p-1"
            >
              <DropdownMenuLabel className="px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border my-1" />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50 px-3 cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
