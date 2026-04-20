import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Eye, EyeOff, Users, Globe, Clock } from 'lucide-react';
import { authService } from '@/services/authService';
import { API_BASE_URL } from '@/config/env';

interface SharedWorkspace {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export default function SharePage() {
  const { workspaceId, token } = useParams<{ workspaceId: string; token: string }>();
  const navigate = useNavigate();
  
  const [workspace, setWorkspace] = useState<SharedWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const loadSharedWorkspace = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/share/${token}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to load shared workspace');
          return;
        }

        const data = await response.json();
        setWorkspace(data.data.workspace);
      } catch (err) {
        console.error('Failed to load shared workspace:', err);
        setError('Failed to load shared workspace');
      } finally {
        setLoading(false);
      }
    };

    loadSharedWorkspace();
  }, [workspaceId, token]);

  const copyToClipboard = async () => {
    if (!workspace) return;
    
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const joinWorkspace = async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        // Redirect to login page with return URL
        navigate(`/signin?redirect=${encodeURIComponent(window.location.href)}`);
        return;
      }

      // Here you would typically join the workspace
      // For now, just navigate to the workspace
      navigate(`/workspace/${workspaceId}`);
    } catch (err) {
      console.error('Failed to join workspace:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-darkblue-50 to-[#38BDF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[#38BDF8] text-2xl font-mono font-bold">&lt;/&gt;</span>
              <span className="text-2xl font-bold text-foreground">Synergy</span>
            </div>
            <p className="text-muted-foreground">Loading shared workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-darkblue-50 to-[#38BDF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[#38BDF8] text-2xl font-mono font-bold">&lt;/&gt;</span>
              <span className="text-2xl font-bold text-foreground">Synergy</span>
            </div>
          </div>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-center text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-darkblue-50 to-[#38BDF8] flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-[#38BDF8] text-2xl font-mono font-bold">&lt;/&gt;</span>
              <span className="text-2xl font-bold text-foreground">Synergy</span>
            </div>
          </div>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-center">Workspace Not Found</CardTitle>
              <CardDescription className="text-center">
                The shared workspace could not be found or may have expired.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Please check the share link or contact the workspace owner.
                </p>
                <Button onClick={() => navigate('/')} variant="outline">
                  Go to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-darkblue-50 to-[#38BDF8] flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-[#38BDF8] text-2xl font-mono font-bold">&lt;/&gt;</span>
            <span className="text-2xl font-bold text-foreground">Synergy</span>
          </div>
          <p className="text-muted-foreground">Shared Workspace</p>
        </div>

        <Card className="border-[#38BDF8]/20">
          <CardHeader>
            <CardTitle className="text-center">{workspace.name}</CardTitle>
            <CardDescription className="text-center">
              You've been invited to join this collaborative workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Workspace Info */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Shared by workspace owner
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Created {new Date(workspace.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={window.location.href}
                  readOnly
                  className="flex-1 bg-muted/50 border-border"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  {copied ? <Eye className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-ide-success text-center">Link copied to clipboard!</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={joinWorkspace}
                className="w-full"
                size="lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Join Workspace
              </Button>
              
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Create Your Own Workspace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
