import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useWorkspace } from '@/context/WorkspaceContext';
import { authService } from '@/services/authService';
import { buildRealtimeWsCandidates } from '@/config/env';

const buildTerminalWsCandidates = (workspaceId: string, token: string): string[] => {
  const query = `workspaceId=${encodeURIComponent(workspaceId)}&token=${encodeURIComponent(token)}`;
  return buildRealtimeWsCandidates('/ws/terminal', query);
};

import { useTheme } from '@/components/ThemeProvider';

export default function TerminalPanel() {
  const { theme } = useTheme();
  const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'problems' | 'output' | 'terminal'>('terminal');
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [reconnectNonce, setReconnectNonce] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectedRef = useRef(false);
  const reconnectAttemptRef = useRef(0);
  const connectSessionRef = useRef(0);
  const manualCloseRef = useRef(false);
  const { workspace } = useWorkspace();

  const darkTheme = {
    background: 'transparent',
    foreground: '#e2e8f0',
    black: '#000000',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#8b5cf6',
    cyan: '#06b6d4',
    white: '#ffffff',
    brightBlack: '#6b7280',
    brightRed: '#f87171',
    brightGreen: '#34d399',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#a78bfa',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
    selectionBackground: 'rgba(88, 80, 236, 0.4)',
    cursor: '#a8a29e'
  };

  const lightTheme = {
    background: 'transparent',
    foreground: '#334155', // slate-700
    black: '#000000',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#3b82f6',
    magenta: '#8b5cf6',
    cyan: '#06b6d4',
    white: '#ffffff',
    brightBlack: '#6b7280',
    brightRed: '#f87171',
    brightGreen: '#34d399',
    brightYellow: '#fbbf24',
    brightBlue: '#60a5fa',
    brightMagenta: '#a78bfa',
    brightCyan: '#22d3ee',
    brightWhite: '#ffffff',
    selectionBackground: 'rgba(88, 80, 236, 0.3)',
    cursor: '#475569' // slate-600
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = isLight ? lightTheme : darkTheme;
    }
  }, [isLight]);

  useEffect(() => {
    if (!containerRef.current || terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontSize: 14,
      fontFamily: "Consolas, 'Courier New', monospace",
      cursorStyle: "block",
      allowTransparency: true,
      theme: isLight ? lightTheme : darkTheme,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    const fit = () => {
      if (containerRef.current && containerRef.current.offsetParent !== null) {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn('Xterm fit failed:', e);
        }
      }
    };

    term.open(containerRef.current);
    fit();
    term.focus();

    term.onData((data) => {
      console.log('sending:', data);
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(data);
      }
    });

    const termResizeDisposable = term.onResize(({ cols, rows }) => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'terminal:resize',
            cols,
            rows,
          })
        );
      }
    });

    terminalRef.current = term;
    fitRef.current = fitAddon;

    requestAnimationFrame(() => {
      fit();
      term.focus();
    });

    const resizeHandler = () => {
      if (containerRef.current?.offsetParent) {
        fitAddon.fit();
        term.focus();
      }
    };

    window.addEventListener('resize', resizeHandler);
    return () => {
      window.removeEventListener('resize', resizeHandler);
      termResizeDisposable.dispose();
      term.dispose();
      terminalRef.current = null;
      fitRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleToggleTerminal = () => {
      setIsCollapsed(v => !v);
      setActiveTab('terminal');
    };
    window.addEventListener('workspace:toggle-terminal', handleToggleTerminal);
    return () => window.removeEventListener('workspace:toggle-terminal', handleToggleTerminal);
  }, []);

  useEffect(() => {
    const token = authService.getToken();
    if (!workspace || !token || !terminalRef.current) return;

    connectSessionRef.current += 1;
    const sessionId = connectSessionRef.current;
    manualCloseRef.current = false;

    const cleanupReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = (attempt = 0) => {
      if (sessionId !== connectSessionRef.current || manualCloseRef.current) {
        return;
      }

      cleanupReconnectTimer();
      const candidates = buildTerminalWsCandidates(workspace.id, token);
      const candidate = candidates[Math.min(attempt, candidates.length - 1)];
      setStatus('connecting');
      const socket = new WebSocket(candidate);
      socket.binaryType = 'arraybuffer';
      socketRef.current = socket;
      connectedRef.current = false;

      socket.onopen = () => {
        if (sessionId !== connectSessionRef.current || manualCloseRef.current) {
          socket.close();
          return;
        }

        connectedRef.current = true;
        reconnectAttemptRef.current = 0;
        setStatus('connected');
        if (containerRef.current?.offsetParent) {
          fitRef.current?.fit();
        }
        terminalRef.current?.focus();
        socket.send(
          JSON.stringify({
            type: 'terminal:resize',
            cols: terminalRef.current?.cols || 120,
            rows: terminalRef.current?.rows || 30,
          })
        );
      };

      socket.onmessage = async (event) => {
        if (sessionId !== connectSessionRef.current || manualCloseRef.current) return;

        const rawData = typeof event.data === 'string'
          ? event.data
          : event.data instanceof ArrayBuffer
            ? new TextDecoder('utf-8').decode(new Uint8Array(event.data))
            : event.data instanceof Blob
              ? await event.data.text()
              : '';

        console.log('received:', rawData);

        let data = rawData;
        if (rawData.startsWith('{')) {
          try {
            const payload = JSON.parse(rawData) as { type?: string; data?: string; message?: string; exitCode?: number };
            if (payload.type === 'terminal:data' && typeof payload.data === 'string') {
              data = payload.data;
            } else if (payload.type === 'terminal:error' && terminalRef.current) {
              terminalRef.current.writeln(`\r\n\x1b[31m${payload.message || 'Terminal error'}\x1b[0m`);
              return;
            } else if (payload.type === 'terminal:exit' && terminalRef.current) {
              terminalRef.current.writeln(`\r\n\x1b[33m[process exited: ${payload.exitCode ?? 0}]\x1b[0m`);
              return;
            }
          } catch {
            // Fall through to raw write.
          }
        }

        if (terminalRef.current && data) {
          terminalRef.current.write(data);
          terminalRef.current.scrollToBottom();
          requestAnimationFrame(() => {
            terminalRef.current?.scrollToBottom();
            terminalRef.current?.focus();
          });
          terminalRef.current.focus();
        }
      };

      socket.onerror = () => {
        if (sessionId !== connectSessionRef.current || manualCloseRef.current) return;
        setStatus('error');
        terminalRef.current?.writeln(`\r\n\x1b[31m[terminal socket error: ${candidate}]\x1b[0m`);
      };

      socket.onclose = (event) => {
        if (sessionId !== connectSessionRef.current || manualCloseRef.current) {
          return;
        }

        setStatus('disconnected');

        if (event.code === 4001) {
          terminalRef.current?.writeln('\r\n\x1b[31m[auth failed: please sign out and sign in again]\x1b[0m');
        }
        if (event.code === 4003) {
          terminalRef.current?.writeln('\r\n\x1b[31m[workspace permission denied for terminal]\x1b[0m');
        }

        const nextAttempt = !connectedRef.current && attempt < candidates.length - 1 ? attempt + 1 : 0;
        reconnectAttemptRef.current += 1;
        const retryDelay = Math.min(8000, 1000 * Math.max(1, reconnectAttemptRef.current));
        reconnectTimerRef.current = window.setTimeout(() => {
          connect(nextAttempt);
        }, retryDelay);
      };
    };

    connect(0);

    return () => {
      manualCloseRef.current = true;
      cleanupReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [workspace?.id, reconnectNonce]);

  useEffect(() => {
    if (!isCollapsed && containerRef.current?.offsetParent) {
      fitRef.current?.fit();
      terminalRef.current?.focus();
    }
  }, [isCollapsed]);

  if (!workspace) {
    return null;
  }

  const reconnectNow = () => {
    if (!workspace) return;
    manualCloseRef.current = false;
    reconnectAttemptRef.current = 0;
    socketRef.current?.close();
    setStatus('connecting');
    setReconnectNonce((v) => v + 1);
  };

  return (
    <div className={`border-t border-border bg-ide-terminal flex flex-col transition-all duration-200 w-full font-sans overflow-hidden ${isCollapsed ? 'h-9 shrink-0' : 'h-64'}`}>
      <div className="h-9 px-4 flex items-center justify-between bg-ide-terminal border-b border-border shrink-0">
        <div className="flex items-center gap-6 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          <button 
            onClick={() => setActiveTab('problems')}
            className={`hover:text-foreground transition-colors border-b focus:outline-none py-1.5 ${activeTab === 'problems' ? 'text-foreground border-primary' : 'border-transparent focus:border-primary'}`}
          >
            Problems
          </button>
          <button 
            onClick={() => setActiveTab('output')}
            className={`hover:text-foreground transition-colors border-b focus:outline-none py-1.5 ${activeTab === 'output' ? 'text-foreground border-primary' : 'border-transparent focus:border-primary'}`}
          >
            Output
          </button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`hover:text-foreground transition-colors border-b focus:outline-none flex items-center gap-2 py-1.5 ${activeTab === 'terminal' ? 'text-foreground border-primary' : 'border-transparent focus:border-primary'}`}
          >
             Terminal
             <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={reconnectNow}
            className="p-1 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Reconnect terminal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsCollapsed((v) => !v)}
            className="p-1 hover:bg-muted/50 rounded text-muted-foreground hover:text-foreground transition-colors"
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="flex-1 w-full bg-ide-terminal flex flex-col relative min-h-0">
           <div ref={containerRef} className={`absolute inset-0 w-full h-full overflow-hidden ${activeTab !== 'terminal' ? 'opacity-0 pointer-events-none' : ''}`} />
           
           {activeTab === 'problems' && (
             <div className="absolute inset-0 w-full h-full p-4 flex items-start justify-start text-muted-foreground font-sans text-sm animate-fade-in overflow-y-auto">
               No problems have been detected in the workspace.
             </div>
           )}

           {activeTab === 'output' && (
             <div className="absolute inset-0 w-full h-full p-4 flex flex-col text-muted-foreground font-mono text-xs animate-fade-in overflow-y-auto">
               <div className="text-muted-foreground/70 mb-2">[Synergy Output Channel]</div>
               <div>Waiting for task execution logs...</div>
             </div>
           )}
        </div>
      )}
    </div>
  );
}
