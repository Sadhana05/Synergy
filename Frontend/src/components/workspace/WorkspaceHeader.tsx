import { Code2, Users, Wifi, Rocket, CheckCircle2, XCircle, Loader2, ExternalLink, Save, Link2, Folder, Copy } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import LiveShareDialog from '@/components/workspace/LiveShareDialog';
import { workspaceService } from '@/services/workspaceService';
import { ThemeToggle } from '@/components/ThemeToggle';

type DeployStatus = 'idle' | 'validating' | 'deploying' | 'success' | 'failed';

export default function WorkspaceHeader() {
  const { workspace, collaborators, files, saveWorkspace, isSaving, liveMembers, shareLink, addLiveMember, removeLiveMember, showShareDialog, setShowShareDialog } = useWorkspace();
  const onlineCount = collaborators.filter(c => c.isOnline).length;
  const [deployStatus, setDeployStatus] = useState<DeployStatus>('idle');
  const [deployUrl, setDeployUrl] = useState('');
  const [deployError, setDeployError] = useState('');
  const [deployMeta, setDeployMeta] = useState<{ framework?: string; mode?: string }>({});
  const [showDeployDialog, setShowDeployDialog] = useState(false);


  const handleDeploy = async () => {
    if (!workspace?.id || files.length === 0) {
      setDeployError('No files to deploy. Add files to your workspace first.');
      setDeployStatus('failed');
      setShowDeployDialog(true);
      return;
    }

    setShowDeployDialog(true);
    setDeployError('');
    setDeployUrl('');
    setDeployMeta({});

    // start with validating
    setDeployStatus('validating');
    await Promise.resolve();

    setDeployStatus('deploying');

    try {
      const data = await workspaceService.deployWorkspace(workspace.id);
      setDeployUrl(data.url || '');
      setDeployMeta({ framework: data.framework, mode: data.mode });
      setDeployStatus('success');
    } catch (err: unknown) {
      setDeployStatus('failed');
      if (err instanceof Error) setDeployError(err.message);
      else setDeployError('Unknown error during deployment');
    }
  };

  const statusIcon = {
    idle: null,
    validating: <Loader2 className="w-4 h-4 animate-spin text-ide-warning" />,
    deploying: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
    success: <CheckCircle2 className="w-4 h-4 text-ide-success" />,
    failed: <XCircle className="w-4 h-4 text-destructive" />,
  };

  const statusLabel = {
    idle: '',
    validating: 'Validating build…',
    deploying: 'Deploying…',
    success: 'Deployed successfully!',
    failed: 'Deployment failed',
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 py-2 bg-ide-sidebar border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[#38BDF8] text-sm font-mono font-bold">&lt;/&gt;</span>
            <span className="font-semibold text-sm text-foreground">Synergy</span>
          </div>
          {workspace && (
            <>
              <div className="w-px h-4 bg-border" />
              <span className="text-sm text-muted-foreground">{workspace.name}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
         
          {/* Save button (text) */}
          <button
            onClick={saveWorkspace}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ide-info/15 text-ide-info rounded hover:bg-ide-info/25 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>

          {/* Live Share button */}
          <button
            onClick={() => setShowShareDialog(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-accent/15 text-accent rounded hover:bg-accent/25 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Live Share
          </button>


          <button
            onClick={handleDeploy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-ide-success/15 text-ide-success rounded hover:bg-ide-success/25 transition-colors"
          >
            <Rocket className="w-3.5 h-3.5" />
            Deploy
          </button>

          <div className="flex items-center -space-x-2 px-2">
            {collaborators.filter(c => c.isOnline).slice(0, 5).map(c => (
              <div 
                key={c.id} 
                className="relative group transition-transform hover:scale-110 hover:z-10"
                title={c.name}
              >
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-ide-sidebar shadow-sm"
                  style={{ backgroundColor: c.color + '20', color: c.color, borderColor: c.color + '40' }}
                >
                  {c.name[0].toUpperCase()}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ide-sidebar bg-ide-success" />
                
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {c.name}
                </div>
              </div>
            ))}
            {onlineCount > 5 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-ide-sidebar flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                +{onlineCount - 5}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground border-l border-border ml-1">
            <Wifi className="w-3.5 h-3.5 text-ide-success" />
            <span>{onlineCount} online</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Deploy dialog */}
      <Dialog open={showDeployDialog} onOpenChange={setShowDeployDialog}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="w-5 h-5 text-primary" />
              Project Deployment
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {workspace?.name || 'Workspace'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-center gap-2">
              {statusIcon[deployStatus]}
              <span className="text-sm text-foreground">{statusLabel[deployStatus]}</span>
            </div>

            {deployStatus === 'success' && deployUrl && (
              <div className="p-3 rounded-md bg-ide-success/10 border border-ide-success/20">
                <p className="text-xs text-muted-foreground mb-1">Live URL</p>
                {(deployMeta.framework || deployMeta.mode) && (
                  <p className="text-xs text-muted-foreground mb-2">
                    {deployMeta.framework?.toUpperCase() || 'PROJECT'} • {deployMeta.mode === 'node-build' ? 'Built output' : 'Static output'}
                  </p>
                )}
                <a
                  href={deployUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  {deployUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(deployUrl);
                  }}
                  className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy link
                </button>
              </div>
            )}

            {deployStatus === 'failed' && deployError && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{deployError}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Live Share dialog */}
      <LiveShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        shareLink={shareLink}
        members={liveMembers}
        onAddEmail={addLiveMember}
        onRemoveMember={removeLiveMember}
        maxMembers={30}
      />
    </>
  );
}
