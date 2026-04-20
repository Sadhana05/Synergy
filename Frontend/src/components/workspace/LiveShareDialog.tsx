import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { X, UserPlus, Copy, Check, Link2, Globe, Wifi, WifiOff, Mail } from 'lucide-react';

export interface LiveShareMember {
  id: string;
  email: string;
  isOnline: boolean;
  location: string | null;
  status: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: string;
  members: LiveShareMember[];
  onAddEmail: (email: string, role: 'editor' | 'viewer') => void;
  onRemoveMember: (id: string) => void;
  maxMembers: number;
}

export default function LiveShareDialog({ open, onOpenChange, shareLink, members, onAddEmail, onRemoveMember, maxMembers }: Props) {
  const [emailInput, setEmailInput] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [copied, setCopied] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleAddEmail = () => {
    const email = emailInput.trim();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (members.length >= maxMembers) {
      setEmailError(`Maximum ${maxMembers} members allowed`);
      return;
    }
    if (members.some(m => m.email === email)) {
      setEmailError('This email is already invited');
      return;
    }
    setEmailError('');
    onAddEmail(email, role);
    setEmailInput('');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const onlineMembers = members.filter(m => m.isOnline);
  const offlineMembers = members.filter(m => !m.isOnline);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Link2 className="w-5 h-5 text-primary" />
            Live Share
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Invite up to {maxMembers} members to collaborate in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Add email */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
              Invite by email
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setEmailError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddEmail(); }}
                  placeholder="user@example.com"
                  className="w-full bg-muted text-foreground text-sm pl-9 pr-3 py-2 rounded-lg border border-border outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>
              <select
                value={role}
                onChange={e => setRole(e.target.value as 'editor' | 'viewer')}
                className="bg-muted text-foreground text-xs px-2 py-2 rounded-lg border border-border outline-none"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleAddEmail}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {emailError && <p className="text-[11px] text-destructive mt-1">{emailError}</p>}
          </div>

          {/* Share link */}
          {members.length > 0 && shareLink && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Shareable Link
              </label>
              <div className="flex items-center gap-2 bg-muted rounded-lg p-2 border border-border">
                <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 text-xs text-foreground truncate font-mono">{shareLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1.5 rounded hover:bg-background transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-ide-success" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                </button>
              </div>
            </div>
          )}

          {/* Members count */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Members ({members.length}/{maxMembers})
            </span>
          </div>

          {/* Online members */}
          {onlineMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Wifi className="w-3 h-3 text-ide-success" />
                <span className="text-[11px] font-medium text-ide-success">Online ({onlineMembers.length})</span>
              </div>
              <div className="space-y-1">
                {onlineMembers.map(m => (
                  <MemberRow key={m.id} member={m} onRemove={() => onRemoveMember(m.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Offline members */}
          {offlineMembers.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <WifiOff className="w-3 h-3 text-muted-foreground" />
                <span className="text-[11px] font-medium text-muted-foreground">Offline ({offlineMembers.length})</span>
              </div>
              <div className="space-y-1">
                {offlineMembers.map(m => (
                  <MemberRow key={m.id} member={m} onRemove={() => onRemoveMember(m.id)} />
                ))}
              </div>
            </div>
          )}

          {members.length === 0 && (
            <div className="text-center py-4 text-muted-foreground text-xs">
              No members invited yet. Add an email to start sharing.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MemberRow({ member, onRemove }: { member: LiveShareMember; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 group transition-colors">
      <div className="relative">
        <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
          {member.email[0].toUpperCase()}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-card ${member.isOnline ? 'bg-ide-success' : 'bg-muted-foreground'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate">{member.email}</p>
        {member.location && (
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Globe className="w-2.5 h-2.5" />
            {member.location}
          </p>
        )}
      </div>
      <button
        onClick={onRemove}
        className="p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/15 rounded transition-all"
        title="Remove member"
      >
        <X className="w-3 h-3 text-destructive" />
      </button>
    </div>
  );
}
