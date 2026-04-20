import { useState } from 'react';
import { Folder, Clock, Users, ArrowRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export interface SavedWorkspaceEntry {
  id: string;
  name: string;
  fileCount: number;
  lastModified: Date;
  memberCount: number;
}

interface Props {
  workspaces: SavedWorkspaceEntry[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
}

function formatRelative(date: Date) {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function SavedWorkspacesList({ workspaces, onOpen, onDelete }: Props) {
  const [deleteWorkspaceId, setDeleteWorkspaceId] = useState<string | null>(null);
  const workspaceToDelete = workspaces.find(ws => ws.id === deleteWorkspaceId);

  const handleConfirmDelete = () => {
    if (deleteWorkspaceId && onDelete) {
      onDelete(deleteWorkspaceId);
      setDeleteWorkspaceId(null);
    }
  };

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-xs">
        No saved workspaces yet. Create one to get started.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {workspaces.map(ws => (
          <div key={ws.id} className="relative group">
            <button
              onClick={() => onOpen(ws.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                <Folder className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ws.name}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatRelative(ws.lastModified)}
                  </span>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Users className="w-2.5 h-2.5" />
                    {ws.memberCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {ws.fileCount} files
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteWorkspaceId(ws.id);
                    }}
                    className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Delete
                  </Button>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
        ))}
      </div>

      {onDelete && workspaceToDelete && (
        <AlertDialog open={deleteWorkspaceId !== null} onOpenChange={(open) => !open && setDeleteWorkspaceId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Workspace</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{workspaceToDelete.name}</strong>? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
