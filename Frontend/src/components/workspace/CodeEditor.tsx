import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import { loader } from '@monaco-editor/react';
import { editor as MonacoEditorType } from 'monaco-editor';
import * as monaco from 'monaco-editor';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { X, Save, Sparkles, Wrench, TestTube2, Lightbulb } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';
import { workspaceService } from '@/services/workspaceService';
import { COLLAB_SERVER_URL } from '@/config/env';

const getCollabWsBase = (): string => COLLAB_SERVER_URL;

// Use the bundled Monaco to avoid network/CDN issues
loader.config({ monaco });

const colorFromSeed = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 78%, 56%)`;
};

type RelativeSelectionState = {
  anchor: string;
  head: string;
};

const encodeRelativePosition = (position: Y.RelativePosition): string => {
  const bytes = Y.encodeRelativePosition(position);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const decodeRelativePosition = (encoded: string): Y.RelativePosition | null => {
  try {
    const binary = atob(encoded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return Y.decodeRelativePosition(bytes);
  } catch {
    return null;
  }
};

const clampOffset = (offset: number, model: MonacoEditorType.ITextModel): number => {
  return Math.max(0, Math.min(offset, model.getValueLength()));
};

import { useTheme } from '@/components/ThemeProvider';

export default function CodeEditor() {
  const { workspace, activeFile, openFiles, closeFile, setActiveFile, updateFileContent, updatePresenceCursor } = useWorkspace();
  const { user } = useAuth();
  const { theme } = useTheme();
  
  const isLight = theme === 'light' || (theme === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches);

  const [saveIndicator, setSaveIndicator] = useState(false);
  const [monacoReady, setMonacoReady] = useState(false);
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const activeFileIdRef = useRef<string | null>(null);
  const yDocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const awarenessStyleRef = useRef<HTMLStyleElement | null>(null);
  const currentModelRef = useRef<MonacoEditorType.ITextModel | null>(null);
  const collabReadyRef = useRef(false);

  const filePath = activeFile?.path || '';
  const language = useMemo(() => activeFile?.language || 'plaintext', [activeFile?.language]);

  const getAiSelectionCode = () => {
    const editor = editorRef.current;
    const model = editor?.getModel();
    if (!editor || !model || !activeFile) {
      return activeFile?.content || '';
    }

    const selection = editor.getSelection();
    if (selection && !selection.isEmpty()) {
      return model.getValueInRange(selection);
    }

    return model.getValue();
  };

  useEffect(() => {
    activeFileIdRef.current = activeFile?.id || null;
  }, [activeFile?.id]);

  const cleanupCollab = () => {
    collabReadyRef.current = false;
    bindingRef.current?.destroy();
    if (providerRef.current && awarenessStyleRef.current) {
      const awareness = providerRef.current.awareness;
      awarenessStyleRef.current.remove();
      awarenessStyleRef.current = null;
      awareness.setLocalStateField('selection', null);
    }
    providerRef.current?.destroy();
    yDocRef.current?.destroy();
    bindingRef.current = null;
    providerRef.current = null;
    yDocRef.current = null;
  };

  const showSaveIndicator = () => {
    setSaveIndicator(true);
    setTimeout(() => setSaveIndicator(false), 1200);
  };

  const triggerAiAction = (action: 'explain' | 'fix' | 'refactor' | 'tests') => {
    if (!workspace || !activeFile) return;

    const code = getAiSelectionCode();
    window.dispatchEvent(
      new CustomEvent('workspace:ai-action', {
        detail: {
          workspaceId: workspace.id,
          action,
          code,
          language: activeFile.language || 'plaintext',
          context: activeFile.path,
          fileName: activeFile.name,
        },
      })
    );
  };

  useEffect(() => {
    const handleSaveEvent = async () => {
      if (editorRef.current && activeFile) {
        const latestContent = editorRef.current.getValue();
        updateFileContent(activeFile.id, latestContent);
        await workspaceService.updateNode(activeFile.id, { content: latestContent });
        showSaveIndicator();
      }
    };
    window.addEventListener('workspace:save', handleSaveEvent);
    return () => window.removeEventListener('workspace:save', handleSaveEvent);
  }, [activeFile?.id, updateFileContent]);

  const handleEditorWillMount = (monaco: any) => {
    monaco.editor.defineTheme('synergy-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f111a', // Matching Midnight Galaxy background
        'editor.lineHighlightBackground': '#1a1d2d',
        'editorLineNumber.foreground': '#4a5568',
        'editorLineNumber.activeForeground': '#a0aec0',
      }
    });
  };

  const handleEditorMount: OnMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    setMonacoReady(true);

    // Ensure monaco remeasures fonts once our web fonts (like JetBrains Mono) are fully loaded.
    // Without this, the cursor click hit-box gets severely misaligned.
    document.fonts.ready.then(() => {
      monacoInstance.editor.remeasureFonts();
    });

    const changeDisposable = editor.onDidChangeModelContent(() => {
      if (!collabReadyRef.current) return;
      const fileId = activeFileIdRef.current;
      if (!fileId) return;
      updateFileContent(fileId, editor.getValue());
    });

    return () => {
      changeDisposable.dispose();
    };
  };

  useEffect(() => {
    if (!editorRef.current || !workspace || !activeFile) {
      return;
    }

    const model = editorRef.current.getModel();
    if (!model) {
      return;
    }

    currentModelRef.current = model;
    cleanupCollab();
    collabReadyRef.current = false;

    const yDoc = new Y.Doc();
    // Ensure room name is stable and URL-safe
    const roomName = `workspace_${workspace.id}_file_${activeFile.id}`;
    const providerUrl = getCollabWsBase();
    const provider = new WebsocketProvider(providerUrl, roomName, yDoc);

    const yText = yDoc.getText('monaco');
    const initialContent = activeFile.content || '';
    let hasBound = false;

    const bindEditor = () => {
      if (hasBound || !editorRef.current) return;
      // We pass null for awareness here so we can handle cursors/names manually
      // with full control over styles and labels.
      const nextBinding = new MonacoBinding(yText, model, new Set([editorRef.current]));
      bindingRef.current = nextBinding;
      hasBound = true;
    };

    const seedInitialContent = () => {
      if (yText.length > 0 || !initialContent) return;
      yDoc.transact(() => {
        yText.insert(0, initialContent);
      });
    };

    // If websocket sync is delayed, keep local file content visible and editable.
    const syncFallbackTimer = window.setTimeout(() => {
      if (collabReadyRef.current) return;
      seedInitialContent();
      bindEditor();
      collabReadyRef.current = true;
    }, 1200);

    const handleSync = (synced: boolean) => {
      if (!synced) return;
      try {
        seedInitialContent();
        if (editorRef.current) {
          bindEditor();
          collabReadyRef.current = true;
          window.clearTimeout(syncFallbackTimer);
          provider.off('sync', handleSync);
          // Initial awareness render once binding is ready.
          scheduleAwarenessRender(true);
        }
      } catch (err) {
        console.error('[Collab] Failed during provider sync:', err);
      }
    };
    provider.on('sync', handleSync);

    const awareness = provider.awareness;
    const displayName = user?.username || user?.email || (authService.getToken() ? 'Collaborator' : 'Guest');
    const displayColor = colorFromSeed(user?.id || displayName);

    const styleElement = document.createElement('style');
    styleElement.setAttribute('data-collab-room', roomName);
    document.head.appendChild(styleElement);
    awarenessStyleRef.current = styleElement;

    let remoteDecorations: string[] = [];
    let renderRaf = 0;
    let forceRender = false;
    let lastStateSignature = '';

    const updateAwarenessStyles = (force = false) => {
      const cssRules: string[] = [];
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = [];
      const signatureParts: string[] = [];

      awareness.getStates().forEach((state, clientId) => {
        if (clientId === yDoc.clientID) return;

        const userState = (state as { user?: { name?: string; color?: string }; selection?: RelativeSelectionState | null }).user;
        const selection = (state as { selection?: RelativeSelectionState | null }).selection;
        
        if (!userState?.name) return;

        const color = userState.color || colorFromSeed(String(clientId));
        const selectionColor = color.startsWith('hsl(')
          ? color.replace('hsl(', 'hsla(').replace(')', ', 0.22)')
          : color;
        const safeName = userState.name.replace(/"/g, '\\"');

        signatureParts.push(
          `${clientId}:${safeName}:${color}:${selection?.anchor || ''}:${selection?.head || ''}`
        );

        // Update dynamic CSS
        cssRules.push(
          `.yRemoteSelection-${clientId} { 
            background-color: ${selectionColor} !important;
            border-radius: 2px !important;
          }`,
          `.yRemoteSelectionHead-${clientId} { 
            position: absolute !important;
            border-left: 2px solid ${color} !important;
            height: 100% !important;
            z-index: 100 !important;
          }`,
          `.yRemoteSelectionHead-${clientId}::after { 
            content: "${safeName}" !important; 
            position: absolute !important; 
            top: -1.5em !important; 
            left: 0 !important;
            background: ${color} !important; 
            color: #ffffff !important; 
            border-radius: 4px 4px 4px 0 !important; 
            padding: 2px 8px !important; 
            font-size: 11px !important; 
            font-weight: bold !important;
            white-space: nowrap !important; 
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
            display: block !important;
            z-index: 1001 !important;
          }`
        );

        // Add decorations if selection exists
        if (selection?.anchor && selection?.head) {
          const anchorRelative = decodeRelativePosition(selection.anchor);
          const headRelative = decodeRelativePosition(selection.head);
          if (!anchorRelative || !headRelative) return;

          const anchorAbsolute = Y.createAbsolutePositionFromRelativePosition(anchorRelative, yDoc);
          const headAbsolute = Y.createAbsolutePositionFromRelativePosition(headRelative, yDoc);

          if (!anchorAbsolute || !headAbsolute || anchorAbsolute.type !== yText || headAbsolute.type !== yText) {
            return;
          }

          const startOffset = clampOffset(Math.min(anchorAbsolute.index, headAbsolute.index), model);
          const endOffset = clampOffset(Math.max(anchorAbsolute.index, headAbsolute.index), model);
          const headOffset = clampOffset(headAbsolute.index, model);

          const start = model.getPositionAt(startOffset);
          const end = model.getPositionAt(endOffset);
          const headPosition = model.getPositionAt(headOffset);
          
          newDecorations.push({
            range: new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column),
            options: {
              className: `yRemoteSelection-${clientId}`,
              hoverMessage: { value: userState.name },
            }
          });

          // Head (cursor) decoration with label
          newDecorations.push({
            range: new monaco.Range(headPosition.lineNumber, headPosition.column, headPosition.lineNumber, headPosition.column),
            options: {
              className: `yRemoteSelectionHead-${clientId}`,
              afterContentClassName: `yRemoteSelectionHead-${clientId}`,
              stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
            }
          });
        }
      });

      const signature = signatureParts.sort().join('|');
      if (!force && signature === lastStateSignature) {
        return;
      }
      lastStateSignature = signature;
      
      styleElement.textContent = cssRules.join('\n');
      
      if (editorRef.current && newDecorations.length > 0) {
        remoteDecorations = editorRef.current.deltaDecorations(remoteDecorations, newDecorations);
      } else if (editorRef.current) {
        remoteDecorations = editorRef.current.deltaDecorations(remoteDecorations, []);
      }
    };

    const scheduleAwarenessRender = (forceUpdate = false) => {
      if (forceUpdate) {
        forceRender = true;
      }
      if (renderRaf) {
        return;
      }
      renderRaf = window.requestAnimationFrame(() => {
        renderRaf = 0;
        const shouldForce = forceRender;
        forceRender = false;
        updateAwarenessStyles(shouldForce);
      });
    };

    const publishLocalSelection = (selection: monaco.Selection | null) => {
      if (!selection || !editorRef.current) {
        awareness.setLocalStateField('selection', null);
        return;
      }

      updatePresenceCursor(selection.positionLineNumber, selection.positionColumn);

      const model = editorRef.current.getModel();
      if (!model) {
        return;
      }

      const anchorOffset = model.getOffsetAt(selection.getSelectionStart());
      const headOffset = model.getOffsetAt(selection.getPosition());

      const anchorRelative = Y.createRelativePositionFromTypeIndex(yText, anchorOffset);
      const headRelative = Y.createRelativePositionFromTypeIndex(yText, headOffset);

      awareness.setLocalStateField('selection', {
        anchor: encodeRelativePosition(anchorRelative),
        head: encodeRelativePosition(headRelative),
      } satisfies RelativeSelectionState);
    };

    let publishRaf = 0;
    let latestSelection: monaco.Selection | null = null;
    const schedulePublishLocalSelection = (selection: monaco.Selection | null) => {
      latestSelection = selection;
      if (publishRaf) {
        return;
      }
      publishRaf = window.requestAnimationFrame(() => {
        publishRaf = 0;
        publishLocalSelection(latestSelection);
      });
    };

    // Ensure we are setting the local state before attaching the listener
    const localUser = {
      id: user?.id || 'guest',
      name: displayName,
      color: displayColor,
    };
    awareness.setLocalStateField('user', localUser);

    // Initialize local selection
    if (editorRef.current) {
      schedulePublishLocalSelection(editorRef.current.getSelection());
    }

    const awarenessChangeListener = () => {
      scheduleAwarenessRender();
    };

    scheduleAwarenessRender(true);
    awareness.on('change', awarenessChangeListener);

    const modelChangeListener = model.onDidChangeContent(() => {
      scheduleAwarenessRender(true);
      schedulePublishLocalSelection(editorRef.current?.getSelection() || null);
    });

    // Track local selection
    const selectionListener = editorRef.current.onDidChangeCursorSelection((e) => {
      schedulePublishLocalSelection(e.selection);
    });

    yDocRef.current = yDoc;
    providerRef.current = provider;

    return () => {
      window.clearTimeout(syncFallbackTimer);
      awareness.off('change', awarenessChangeListener);
      modelChangeListener.dispose();
      selectionListener.dispose();
      if (publishRaf) {
        window.cancelAnimationFrame(publishRaf);
      }
      if (renderRaf) {
        window.cancelAnimationFrame(renderRaf);
      }
      provider.off('sync', handleSync);
      if (editorRef.current) {
        editorRef.current.deltaDecorations(remoteDecorations, []);
      }
      cleanupCollab();
    };
  }, [activeFile?.id, user?.id, user?.username, user?.email, updatePresenceCursor]);

  useEffect(() => {
    return () => {
      cleanupCollab();
    };
  }, []);


  if (!activeFile) {
    return (
      <div className="flex-1 flex items-center justify-center bg-ide-editor h-full">
        <div className="text-center animate-fade-in w-full max-w-md px-6">
          <div className="mb-10 flex justify-center">
             <div className="w-32 h-32 rounded-3xl bg-card/30 shadow-inner flex items-center justify-center border border-border/50">
                 <svg className="w-16 h-16 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
             </div>
          </div>
          
          <div className="space-y-3 text-left">
             <div className="flex justify-between items-center px-4 py-2 hover:bg-muted/50 rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Show All Commands</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-foreground font-mono tracking-widest shadow-sm">Ctrl+Shift+P</span>
             </div>
             <div className="flex justify-between items-center px-4 py-2 hover:bg-muted/50 rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Go to File</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-foreground font-mono tracking-widest shadow-sm">Ctrl+P</span>
             </div>
             <div className="flex justify-between items-center px-4 py-2 hover:bg-muted/50 rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Open File</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-foreground font-mono tracking-widest shadow-sm">Ctrl+O</span>
             </div>
             <div className="flex justify-between items-center px-4 py-2 hover:bg-muted/50 rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Open Workspace</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-foreground font-mono tracking-widest shadow-sm">Ctrl+K Ctr+O</span>
             </div>
             <div className="flex justify-between items-center px-4 py-2 hover:bg-muted/50 rounded cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                <span className="text-sm">Toggle Terminal</span>
                <span className="text-xs bg-muted px-2 py-0.5 rounded text-foreground font-mono tracking-widest shadow-sm">Ctrl+Shift+~</span>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-ide-editor overflow-hidden h-full">
      <div className="flex items-center bg-ide-tab-inactive border-b border-border overflow-x-auto">
        {openFiles.map(file => (
          <div
            key={file.id}
            onClick={() => setActiveFile(file)}
            className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer border-r border-border transition-colors
              ${file.id === activeFile.id
                ? 'bg-ide-tab-active text-foreground border-t-2 border-t-primary'
                : 'text-muted-foreground hover:bg-muted/30'}`}
          >
            <span className="truncate max-w-[120px]">{file.name}</span>
            <button
              onClick={(e) => { e.stopPropagation(); closeFile(file.id); }}
              className="hover:bg-muted rounded p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center px-4 py-1 bg-ide-editor border-b border-border/50 text-xs text-muted-foreground gap-2">
        <span className="truncate">{filePath}</span>
        <div className="ml-auto flex items-center gap-1">
          {saveIndicator && (
            <span className="text-green-500 text-xs animate-fade-in">Saved</span>
          )}
          <button
            onClick={async () => {
              if (editorRef.current && activeFile) {
                const latestContent = editorRef.current.getValue();
                updateFileContent(activeFile.id, latestContent);
                await workspaceService.updateNode(activeFile.id, { content: latestContent });
                showSaveIndicator();
              }
            }}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
          <button
            onClick={() => triggerAiAction('explain')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
          >
            <Lightbulb className="w-3 h-3" />
            Explain
          </button>
          <button
            onClick={() => triggerAiAction('fix')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
          >
            <Wrench className="w-3 h-3" />
            Fix
          </button>
          <button
            onClick={() => triggerAiAction('refactor')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
          >
            <Sparkles className="w-3 h-3" />
            Refactor
          </button>
          <button
            onClick={() => triggerAiAction('tests')}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded"
          >
            <TestTube2 className="w-3 h-3" />
            Tests
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          key={activeFile.id}
          height="100%"
          language={language}
          path={activeFile.path}
          defaultValue={activeFile.content || ''}
          theme={isLight ? 'vs-light' : 'synergy-theme'}
          beforeMount={handleEditorWillMount}
          onMount={handleEditorMount}
          loading={<div className="h-full w-full grid place-items-center text-muted-foreground text-sm animate-pulse">Loading Synergy Editor...</div>}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Consolas', monospace",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderLineHighlight: 'all',
            cursorBlinking: 'blink',
            cursorStyle: 'line',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnType: true,
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>

    </div>
  );
}
