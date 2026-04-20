import { useState } from 'react';
import { Wifi, WifiOff, Globe, Users, Copy, Link, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '@/config/env';
import { useWorkspace } from '@/context/WorkspaceContext';
import { authService } from '@/services/authService';

export interface LiveMember {
  id: string;
  email: string;
  isOnline: boolean;
  location: string | null;
}

interface Props {
  members: LiveMember[];
}

export default function LiveSharePanel({ members }: Props) {
  const [showShareLink, setShowShareLink] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareError, setShareError] = useState('');

  const { workspace } = useWorkspace();
  const online = members.filter(m => m.isOnline);
  const offline = members.filter(m => !m.isOnline);

  // Generate share link using backend API
  const generateShareLink = async () => {
    if (!workspace) return;
    
    setIsGenerating(true);
    setShareError('');
    
    try {
      const token = authService.getToken();
      if (!token) {
        setShareError('You must be logged in to generate share links');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/workspaces/${workspace.id}/share`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        setShareError(error.message || 'Failed to generate share link');
        return;
      }

      const data = await response.json();
      setShareLink(data.data.shareUrl);
      setShowShareLink(true);
    } catch (err) {
      console.error('Failed to generate share link:', err);
      setShareError('Failed to generate share link');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy share link
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  // Toggle live session
  const toggleLiveSession = () => {
    setIsLive(!isLive);
    // Here you would typically connect to WebSocket or signaling server
    console.log(isLive ? 'Ending live session' : 'Starting live session');
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-r border-border">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <Users className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Share</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{members.length} members</span>
      </div>

      {/* Live Session Controls */}
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Live Session</span>
          <button
            onClick={toggleLiveSession}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              isLive 
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' 
                : 'bg-ide-success text-white hover:bg-ide-success/90'
            }`}
          >
            {isLive ? 'End Session' : 'Start Session'}
          </button>
        </div>

        {/* Share Link Section */}
        <div className="space-y-2">
          <button
            onClick={generateShareLink}
            disabled={isGenerating || !workspace}
            className="w-full flex items-center justify-center gap-2 px-2 py-1.5 bg-primary/10 hover:bg-primary/20 rounded text-[10px] text-primary transition-colors disabled:opacity-50"
          >
            <Link className="w-3 h-3" />
            {isGenerating ? 'Generating...' : 'Generate Share Link'}
          </button>

          {shareError && (
            <div className="text-[10px] text-destructive bg-destructive/10 px-2 py-1 rounded">
              {shareError}
            </div>
          )}

          {showShareLink && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-2 py-1 bg-muted/50 border border-border rounded text-[10px] text-muted-foreground"
                />
                <button
                  onClick={copyShareLink}
                  className="p-1.5 bg-primary hover:bg-primary/90 rounded text-white transition-colors"
                  title={linkCopied ? 'Copied!' : 'Copy link'}
                >
                  {linkCopied ? <Eye className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              {linkCopied && (
                <p className="text-[10px] text-ide-success text-center">Link copied to clipboard!</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto py-1">
        {/* Online */}
        {online.length > 0 && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <Wifi className="w-3 h-3 text-ide-success" />
              <span className="text-[10px] font-semibold text-ide-success uppercase tracking-wider">Online ({online.length})</span>
            </div>
            {online.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[10px] font-bold text-primary">
                    {m.email[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-ide-sidebar bg-ide-success animate-pulse-dot" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-secondary-foreground truncate">{m.email}</p>
                  {m.location && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Globe className="w-2.5 h-2.5" />
                      {m.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Offline */}
        {offline.length > 0 && (
          <div className="px-2 py-1">
            <div className="flex items-center gap-1.5 px-1 mb-1">
              <WifiOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Offline ({offline.length})</span>
            </div>
            {offline.map(m => (
              <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/30 transition-colors">
                <div className="relative">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                    {m.email[0].toUpperCase()}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-ide-sidebar bg-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                  {m.location && (
                    <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />
                      {m.location}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {members.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-xs">
            <div className="space-y-3">
              <p>No members yet.</p>
              <button
                onClick={generateShareLink}
                disabled={!workspace}
                className="px-3 py-1.5 bg-primary hover:bg-primary/90 rounded text-[10px] text-white transition-colors"
              >
                Generate Share Link to Invite
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
