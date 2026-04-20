import { useAuth } from '@/context/AuthContext';
import { User, Mail, Calendar, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  if (!user) return null;

  const joinDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
        day: 'numeric'
      })
    : 'Unknown';

  return (
    <div className="min-h-screen bg-background flex flex-col p-6 font-sans">
      <div className="max-w-2xl w-full mx-auto flex-1 mt-8">
        <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <h1 className="text-3xl font-bold mb-8">Account Profile</h1>
        
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
          
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-8">
              <div className="w-24 h-24 rounded-2xl bg-primary flex items-center justify-center text-4xl font-bold text-primary-foreground border-4 border-card shadow-lg">
                {user.first_name ? user.first_name[0].toUpperCase() : user.email[0].toUpperCase()}
              </div>
              <Button variant="destructive" size="sm" onClick={handleLogout} className="mb-2">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Synergy User'}
                </h2>
                <p className="text-muted-foreground font-mono mt-1 pr-2">
                  @{user.username || user.email.split('@')[0]}
                  <span className="ml-2 text-xs bg-muted px-2 py-0.5 rounded-full text-foreground/70">ID: {user.id}</span>
                </p>
              </div>
              
              <div className="grid gap-6 py-6 border-y border-border/50">
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="p-2.5 bg-muted rounded-lg text-foreground ring-1 ring-border">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Full Name</p>
                    <p className="text-sm">{user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="p-2.5 bg-muted rounded-lg text-foreground ring-1 ring-border">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Address</p>
                    <p className="text-sm">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-muted-foreground">
                  <div className="p-2.5 bg-muted rounded-lg text-foreground ring-1 ring-border">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Member Since</p>
                    <p className="text-sm">{joinDate}</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
