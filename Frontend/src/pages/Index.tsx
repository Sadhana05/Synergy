import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Folder, Users, Plus, Loader2, Trash2, LayoutGrid, Clock, Rocket, Zap, Bell, Mail, Calendar } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { workspaceService, TemplateInfo } from '@/services/workspaceService';
import AuthHeader from '@/components/auth/AuthHeader';

export default function Index() {
  const [name, setName] = useState('');
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templateId, setTemplateId] = useState('');
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createWorkspace, workspaces, selectWorkspace, isLoading, deleteWorkspace } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isAuthenticated = !!localStorage.getItem('auth_token');

  useEffect(() => {
    workspaceService.getTemplates().then(setTemplates).catch(() => {
      setTemplates([]);
    });
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    try {
      setError('');
      await createWorkspace(name.trim(), templateId || undefined);
      navigate('/workspace');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
      setIsCreating(false);
    }
  };

  const handleOpenWorkspace = (workspace: any) => {
    selectWorkspace(workspace);
    navigate('/workspace');
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspace: any) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      setError('You must be logged in to delete workspaces');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${workspace.name}"? This action cannot be undone.`)) {
      try {
        await deleteWorkspace(workspace.id);
        setError('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete workspace');
      }
    }
  };

  const greetingName = user?.first_name || user?.username || user?.email?.split('@')[0] || 'Developer';
  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <div className="min-h-screen flex flex-col bg-background font-sans">
      <header className="flex items-center justify-between px-6 py-4 bg-card/60 backdrop-blur-md border-b border-border/50 sticky top-0 z-10 w-full">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-primary text-xl font-mono font-bold">&lt;/&gt;</span>
            <span className="font-bold text-lg text-foreground tracking-tight">Synergy</span>
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-md cursor-default">
               <LayoutGrid className="w-4 h-4" />
               Dashboard
             </div>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Bell className="w-5 h-5" />
          </button>
          <AuthHeader />
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back, {greetingName}</h1>
            <p className="text-muted-foreground">Manage your collaborative workspaces and account details seamlessly.</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-8">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            
            {/* Inline Profile Card */}
            <div className="border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm p-6 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              <div className="flex items-center gap-4 mb-5 relative z-10">
                <div className="w-14 h-14 shrink-0 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold border-2 border-primary/30">
                  {user?.first_name ? user.first_name[0].toUpperCase() : user?.email?.[0].toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-lg text-foreground leading-tight truncate">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Developer'}
                  </h2>
                  <p className="text-muted-foreground text-sm truncate">@{user?.username || user?.email?.split('@')[0]}</p>
                </div>
              </div>
              <div className="space-y-3 pt-4 border-t border-border/50 text-sm relative z-10">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary/70 shrink-0" />
                  <span className="truncate">{user?.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary/70 shrink-0" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
            </div>

            {/* New Workspace Creation */}
            <div className="border border-border/50 rounded-xl bg-card/40 backdrop-blur-sm p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                New Workspace
              </h2>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Project Name</Label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
                    placeholder="my-next-big-idea"
                    className="bg-background/50 text-sm focus:border-primary/50"
                    disabled={isCreating || isLoading}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">Starting Template</Label>
                  <select
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    className="w-full bg-background/50 text-foreground text-sm px-3 py-2.5 rounded-md border border-border outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 appearance-none transition-all"
                    disabled={isCreating || isLoading}
                  >
                    <option value="">Blank Project (Default)</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={!name.trim() || isCreating || isLoading}
                  className="w-full mt-2 font-semibold flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                  {isCreating ? 'Deploying...' : 'Create & Open'}
                </Button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-accent" />
              Your Workspaces
            </h2>
            
            {isLoading && workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-xl border border-dashed border-border/60">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Loading your workspaces...</p>
              </div>
            ) : workspaces.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card/20 rounded-xl border border-dashed border-border/60 text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No workspaces yet</h3>
                <p className="text-muted-foreground max-w-sm mb-6 flex-wrap">
                  You haven't created any coding spaces. Jump right in and create your first realtime collaborative project.
                </p>
                <Button onClick={() => document.querySelector('input')?.focus()}>
                  Create Workspace
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {workspaces.map((workspace) => (
                  <div
                    key={workspace.id}
                    onClick={() => handleOpenWorkspace(workspace)}
                    className="group flex flex-col p-5 bg-card/40 border border-border/50 rounded-xl hover:bg-card hover:border-border hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteWorkspace(e, workspace)}
                        className="p-2 rounded-md bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 group-hover:scale-110 transition-transform">
                        <Folder className="w-5 h-5 fill-primary/20" />
                      </div>
                      <h3 className="font-semibold text-lg truncate pr-12">{workspace.name}</h3>
                    </div>
                    
                    <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(workspace.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                        <Users className="w-3.5 h-3.5" />
                        <span>1 Contributor</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}