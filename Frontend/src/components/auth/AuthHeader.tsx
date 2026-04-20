import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const AuthHeader = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex items-center gap-2 border border-[#38BDF8] hover:bg-[#38BDF8] hover:text-white focus:bg-[#38BDF8] focus:text-white transition-colors"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">
              {user.first_name || user.username}
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm">
            <div className="font-medium">{user.first_name || user.username}</div>
            <div className="text-muted-foreground">{user.email}</div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={logout}
            className="border border-[#38BDF8] hover:bg-[#38BDF8] hover:text-white focus:bg-[#38BDF8] focus:text-white transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AuthHeader;
