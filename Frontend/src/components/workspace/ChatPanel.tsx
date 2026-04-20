import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Check, ChevronLeft, ChevronRight, Copy, MessageSquare, Send, Users } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { authService } from '@/services/authService';
import { workspaceService, ChatMessage } from '@/services/workspaceService';
import { buildRealtimeWsCandidates } from '@/config/env';

type PresenceUser = { userId: string; username: string };
type ChatMode = 'team' | 'ai';
type AiAction = 'explain' | 'fix' | 'refactor' | 'tests';
type AiMessage = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string; requestId?: string; streaming?: boolean };
type AiBlock = { type: 'text' | 'code'; content: string; language?: string };
type AiActionEvent = {
  workspaceId: string;
  requestId: string;
  action: AiAction;
  code: string;
  language?: string;
  context?: string;
  fileName?: string;
};

const buildChatWsCandidates = (workspaceId: string, token: string): string[] => {
  const query = `workspaceId=${encodeURIComponent(workspaceId)}&token=${encodeURIComponent(token)}`;
  return buildRealtimeWsCandidates('/ws/chat', query);
};

const actionLabels: Record<AiAction, string> = {
  explain: 'Explain',
  fix: 'Fix',
  refactor: 'Refactor',
  tests: 'Tests',
};

const parseAiBlocks = (content: string): AiBlock[] => {
  const blocks: AiBlock[] = [];
  const codeRegex = /```([a-zA-Z0-9_+-]+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(content)) !== null) {
    const [fullMatch, lang, code] = match;
    const start = match.index;

    if (start > lastIndex) {
      const textPart = content.slice(lastIndex, start).trim();
      if (textPart) {
        blocks.push({ type: 'text', content: textPart });
      }
    }

    blocks.push({ type: 'code', content: code.trimEnd(), language: lang || 'code' });
    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    const tail = content.slice(lastIndex).trim();
    if (tail) {
      blocks.push({ type: 'text', content: tail });
    }
  }

  if (!blocks.length) {
    blocks.push({ type: 'text', content });
  }

  return blocks;
};

export default function ChatPanel() {
  const { workspace } = useWorkspace();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('team');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const connectedRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const token = authService.getToken();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, aiMessages]);

  useEffect(() => {
    if (!workspace || !token) return;

    let mounted = true;
    workspaceService
      .getChatHistory(workspace.id)
      .then((history) => {
        if (mounted) setMessages(history);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load chat history');
      });

    return () => {
      mounted = false;
    };
  }, [workspace?.id, token]);

  useEffect(() => {
    if (!workspace || !token) return;

    const cleanupReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connect = (attempt = 0) => {
      cleanupReconnectTimer();
      const candidates = buildChatWsCandidates(workspace.id, token);
      const candidate = candidates[Math.min(attempt, candidates.length - 1)];
      const socket = new WebSocket(candidate);
      socketRef.current = socket;
      connectedRef.current = false;
      setConnected(false);

      socket.onopen = () => {
        connectedRef.current = true;
        setConnected(true);
        setError('');
      };

      socket.onmessage = (event) => {
        console.log('received:', event.data);

        if (typeof event.data !== 'string') {
          return;
        }

        let handledProtocolMessage = false;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'presence') {
            setPresence(payload.users || []);
            handledProtocolMessage = true;
            return;
          }

          if (payload.type === 'chat:new') {
            setMessages((prev) => [
              ...prev,
              {
                id: payload.id,
                content: payload.content,
                created_at: payload.createdAt,
                username: payload.username,
                user_id: payload.userId,
              },
            ]);
            handledProtocolMessage = true;
            return;
          }

          if (payload.type === 'ai:stream-start') {
            const requestId = payload.requestId as string | undefined;
            if (!requestId) return;

            setAiLoading(true);
            setChatMode('ai');
            setIsCollapsed(false);
            handledProtocolMessage = true;
            return;
          }

          if (payload.type === 'ai:error') {
            const message = typeof payload.message === 'string' ? payload.message : 'AI request failed';
            setError(message);
            setAiLoading(false);
            handledProtocolMessage = true;
            return;
          }
        } catch {
          handledProtocolMessage = false;
        }

        if (handledProtocolMessage) {
          return;
        }

        const content = event.data.trim();
        if (!content) {
          return;
        }

        setAiMessages((prev) => {
          const next = [...prev];
          const lastIndex = next.length - 1;

          if (lastIndex >= 0) {
            next[lastIndex] = {
              ...next[lastIndex],
              role: 'assistant',
              content,
              streaming: false,
            };
          } else {
            next.push({
              id: `ai-assistant-${Date.now()}`,
              role: 'assistant',
              content,
              createdAt: new Date().toISOString(),
              streaming: false,
            });
          }

          return next;
        });
        setAiLoading(false);
      };

      socket.onerror = () => {
        if (!connectedRef.current && attempt < candidates.length - 1) {
          connect(attempt + 1);
          return;
        }
        setError(`Chat socket error (${candidate})`);
      };

      socket.onclose = (event) => {
        setConnected(false);

        if (!connectedRef.current && attempt < candidates.length - 1) {
          connect(attempt + 1);
          return;
        }

        const details = event.reason ? ` ${event.reason}` : '';
        setError(`Chat disconnected code=${event.code}${details}`);

        reconnectTimerRef.current = window.setTimeout(() => {
          connect(0);
        }, 2000);
      };
    };

    connect(0);

    return () => {
      cleanupReconnectTimer();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [workspace?.id, token]);

  const handleAiAction = useCallback(async (event: Event) => {
    const detail = (event as CustomEvent<AiActionEvent>).detail;
    if (!workspace || !detail || detail.workspaceId !== workspace.id) {
      return;
    }

    const actionLabel = actionLabels[detail.action] || detail.action;
    const requestId = detail.requestId || (crypto.randomUUID ? crypto.randomUUID() : `ai-${Date.now()}`);
    const userContent = `${actionLabel} this code:\n\n\`\`\`${detail.language || 'text'}\n${detail.code}\n\`\`\``;

    setChatMode('ai');
    setIsCollapsed(false);
    setAiLoading(true);
    setError('');
    setAiMessages((prev) => [
      ...prev,
      {
        id: `ai-user-${requestId}`,
        role: 'user',
        content: userContent,
        createdAt: new Date().toISOString(),
        requestId,
      },
      {
        id: requestId,
        role: 'assistant',
        content: '',
        createdAt: new Date().toISOString(),
        requestId,
        streaming: true,
      },
    ]);

    try {
      await workspaceService.runAiAction({
        workspaceId: workspace.id,
        requestId,
        action: detail.action,
        code: detail.code,
        language: detail.language,
        context: detail.context,
      });
    } catch (err) {
      setAiLoading(false);
      setError(err instanceof Error ? err.message : 'AI request failed');
      setAiMessages((prev) => prev.map((msg) => (
        msg.requestId === requestId && msg.role === 'assistant'
          ? { ...msg, content: err instanceof Error ? err.message : 'AI request failed', streaming: false }
          : msg
      )));
    }
  }, [workspace]);

  useEffect(() => {
    window.addEventListener('workspace:ai-action', handleAiAction as EventListener);
    return () => window.removeEventListener('workspace:ai-action', handleAiAction as EventListener);
  }, [handleAiAction]);

  const sendTeamMessage = () => {
    const text = input.trim();
    if (!text || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'chat:send',
        content: text,
      })
    );
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const sendAiMessage = async () => {
    const text = input.trim();
    if (!text || !workspace) {
      return;
    }

    const userMessage: AiMessage = {
      id: `ai-user-${Date.now()}`,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setAiMessages((prev) => [...prev, userMessage]);
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setAiLoading(true);
    setError('');

    try {
      const result = await workspaceService.runAiChat(text, workspace.id);
      setAiMessages((prev) => [
        ...prev,
        {
          id: `ai-assistant-${Date.now()}`,
          role: 'assistant',
          content: result,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI request failed');
    } finally {
      setAiLoading(false);
    }
  };

  const sendMessage = async () => {
    if (chatMode === 'ai') {
      await sendAiMessage();
      return;
    }
    sendTeamMessage();
  };

  const copyCode = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCodeId(id);
      window.setTimeout(() => setCopiedCodeId((prev) => (prev === id ? null : prev)), 1200);
    } catch {
      setError('Copy failed');
    }
  };

  const title = useMemo(() => (workspace ? `${workspace.name} chat` : 'Workspace chat'), [workspace]);

  if (!workspace) {
    return null;
  }

  const handleInputChange = (value: string) => {
    setInput(value);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 180)}px`;
    }
  };

  return (
    <div
      className={`flex flex-col border-l border-border bg-ide-sidebar transition-all duration-200 ${
        isCollapsed ? 'w-12 min-w-[48px]' : 'w-full max-w-[460px] md:w-[430px]'
      }`}
    >
      <div className="px-3 py-2 border-b border-border flex items-center justify-between bg-gradient-to-r from-primary/10 via-transparent to-transparent">
        <div className="flex items-center gap-2">
          {chatMode === 'team' ? <MessageSquare className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
          {!isCollapsed && (
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {chatMode === 'team' ? title : 'Synergy AI Chat'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          {!isCollapsed && (
            <>
              <button
                onClick={() => setChatMode('team')}
                className={`px-2 py-1 rounded ${chatMode === 'team' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                Team
              </button>
              <button
                onClick={() => setChatMode('ai')}
                className={`px-2 py-1 rounded ${chatMode === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                AI
              </button>
              {chatMode === 'team' && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-1">
                  <Users className="w-3 h-3" />
                  <span>{presence.length || 1}</span>
                  <span className={connected ? 'text-ide-success' : 'text-ide-warning'}>{connected ? 'live' : 'offline'}</span>
                </div>
              )}
            </>
          )}
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
            title={isCollapsed ? 'Expand chat' : 'Collapse chat'}
          >
            {isCollapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isCollapsed ? (
        <div className="flex-1 flex items-start justify-center pt-3">
          {chatMode === 'team' ? <MessageSquare className="w-4 h-4 text-primary" /> : <Bot className="w-4 h-4 text-primary" />}
        </div>
      ) : (
        <>
          {error && <div className="px-3 py-1 text-[11px] text-red-400 border-b border-border">{error}</div>}

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {chatMode === 'team' ? (
          <>
            {messages.length === 0 && <p className="text-xs text-muted-foreground">No team messages yet.</p>}
            {messages.map((msg) => (
              <div key={msg.id} className="rounded-md bg-muted/40 px-3 py-2">
                <p className="text-[11px] text-primary font-medium">{msg.username}</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-6">{msg.content}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </>
        ) : (
          <>
            {aiMessages.length === 0 && <p className="text-xs text-muted-foreground">Ask AI about this workspace...</p>}
            {aiMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-md px-3 py-2 ${msg.role === 'assistant' ? 'bg-primary/10 border border-primary/20 shadow-sm' : 'bg-muted/40'}`}
              >
                <p className="text-[11px] text-primary font-medium">{msg.role === 'assistant' ? 'Synergy AI' : 'You'}</p>
                {msg.role === 'assistant' ? (
                  <div className="mt-1 space-y-2">
                    {parseAiBlocks(msg.content).map((block, idx) => {
                      const blockId = `${msg.id}-${idx}`;
                      if (block.type === 'code') {
                        return (
                          <div key={blockId} className="rounded-md border border-border bg-black/30 overflow-hidden">
                            <div className="px-2 py-1 border-b border-border flex items-center justify-between">
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{block.language}</span>
                              <button
                                onClick={() => void copyCode(block.content, blockId)}
                                className="text-[10px] px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-foreground flex items-center gap-1"
                              >
                                {copiedCodeId === blockId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedCodeId === blockId ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                            <pre className="text-xs text-foreground whitespace-pre-wrap p-2 overflow-x-auto">{block.content}</pre>
                          </div>
                        );
                      }

                      return (
                        <p key={blockId} className="text-sm leading-6 text-foreground whitespace-pre-wrap">
                          {block.content}
                        </p>
                      );
                    })}
                    {msg.streaming && (
                      <p className="text-[11px] text-muted-foreground animate-pulse">Synergy AI is typing...</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-6">{msg.content}</p>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(msg.createdAt).toLocaleTimeString()}</p>
              </div>
            ))}
          </>
        )}
          </div>

          <div className="p-3 border-t border-border flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage();
                }
              }}
              rows={3}
              placeholder={chatMode === 'team' ? 'Type team message...' : 'Ask AI anything about this workspace...'}
              className="flex-1 bg-muted border border-border rounded-md px-3 py-2 text-sm leading-6 resize-none outline-none focus:border-primary min-h-[88px]"
            />
            <button
              onClick={() => void sendMessage()}
              className="p-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              disabled={aiLoading || !input.trim() || (chatMode === 'team' && !connected)}
            >
              {aiLoading ? <span className="text-[10px]">AI...</span> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
