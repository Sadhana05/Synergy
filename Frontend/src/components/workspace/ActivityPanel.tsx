import { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, FileEdit, FolderPlus, Trash2, Upload, FilePlus, Move, Save, Users } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { ActivityEntry } from '@/types/workspace';

const actionIcons: Record<ActivityEntry['action'], React.ElementType> = {
  created: FilePlus,
  edited: FileEdit,
  deleted: Trash2,
  uploaded: Upload,
  renamed: FolderPlus,
  moved: Move,
  saved: Save,
};

const actionColors: Record<ActivityEntry['action'], string> = {
  created: 'text-ide-success',
  edited: 'text-ide-info',
  deleted: 'text-destructive',
  uploaded: 'text-primary',
  renamed: 'text-ide-warning',
  moved: 'text-accent',
  saved: 'text-ide-success',
};

function formatTime(date: Date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ActivityPanel() {
  const { activity, collaborators, presenceUsers } = useWorkspace();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const activeUsers = presenceUsers.filter((u) => u.status === 'active');
  const idleUsers = presenceUsers.filter((u) => u.status === 'idle');

  return (
    <div
      className={`flex flex-col bg-ide-sidebar border-l border-border transition-all duration-200 ${
        isCollapsed ? 'w-12 min-w-[48px]' : 'w-64'
      }`}
    >
      {/* Collaborators */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Users</span>}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80 ml-auto"
            title={isCollapsed ? 'Expand activity' : 'Collapse activity'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        </div>

        {!isCollapsed && (
          <div className="mt-2 space-y-3">
            {/* Active Section */}
            {activeUsers.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 px-1 opacity-80">
                  <div className="w-1.5 h-1.5 rounded-full bg-ide-success" />
                  <span className="text-[10px] font-bold text-ide-success uppercase tracking-tighter">Active</span>
                </div>
                {activeUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-muted/30 transition-colors group">
                    <div className="relative">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-border/50"
                        style={{ backgroundColor: u.color + '20', color: u.color }}
                      >
                        {u.name[0].toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-ide-sidebar bg-ide-success animate-pulse-dot" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-secondary-foreground truncate font-medium">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.id}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ide-success/20 text-ide-success">active</span>
                  </div>
                ))}
              </div>
            )}

            {/* Idle Section */}
            {idleUsers.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 px-1 opacity-60">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Idle</span>
                </div>
                {idleUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-2 px-1 py-0.5 rounded opacity-70 hover:opacity-100 transition-opacity">
                    <div className="relative overflow-hidden grayscale">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-muted/50 border border-border/50 text-muted-foreground"
                      >
                        {u.name[0].toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground/80 truncate">{u.id}</p>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">idle</span>
                  </div>
                ))}
              </div>
            )}

            {activeUsers.length === 0 && idleUsers.length === 0 && collaborators.length === 0 && (
              <div className="px-1 py-2 text-[11px] text-muted-foreground">No users connected yet</div>
            )}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center justify-start pt-3 gap-3">
          <Users className="w-4 h-4 text-primary" />
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Activity</span>
          </div>
          <div className="px-2 space-y-0.5">
            {activity.length === 0 && (
              <div className="px-2 py-4 text-center text-muted-foreground/50 text-xs">
                No activity yet
              </div>
            )}
            {activity.map(entry => {
              const Icon = actionIcons[entry.action];
              const colorClass = actionColors[entry.action];
              return (
                <div key={entry.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/30 animate-fade-in">
                  <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${colorClass}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-secondary-foreground truncate">
                      <span className="font-medium text-foreground">{entry.user}</span>{' '}
                      {entry.action} {entry.target}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
