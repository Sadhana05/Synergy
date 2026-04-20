import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const { loginWithGitHub } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(errorParam);
      setIsLoading(false);
      return;
    }

    if (!code) {
      setError('No authorization code received');
      setIsLoading(false);
      return;
    }

    if ((window as any).__githubAuthAttempted) return;
    (window as any).__githubAuthAttempted = true;

    const handleGitHubAuth = async () => {
      try {
        await loginWithGitHub(code);
        navigate('/dashboard');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'GitHub authentication failed');
      } finally {
        setIsLoading(false);
      }
    };

    handleGitHubAuth();
  }, [searchParams, loginWithGitHub, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-primary text-3xl font-mono font-bold">&lt;/&gt;</span>
            <span className="text-3xl font-bold tracking-tight text-foreground">Synergy</span>
          </div>
          <p className="text-muted-foreground mt-2">GitHub Authentication</p>
        </div>

        <Card className="border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl">
          <CardHeader>
            <CardTitle className="text-center">
              {isLoading ? 'Authenticating...' : 'Authentication'}
            </CardTitle>
            <CardDescription className="text-center">
              {isLoading ? 'Please wait while we authenticate you with GitHub' : ''}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center py-8">
            {isLoading && (
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="text-muted-foreground">Signing you in...</p>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!isLoading && !error && (
              <div className="text-center">
                <p className="text-green-500">Authentication successful!</p>
                <p className="text-muted-foreground text-sm mt-2">Redirecting...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GitHubCallback;
