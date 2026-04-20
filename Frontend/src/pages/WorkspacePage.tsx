import FileExplorer from '@/components/workspace/FileExplorer';
import CodeEditor from '@/components/workspace/CodeEditor';
import TerminalPanel from '@/components/workspace/TerminalPanel';
import ChatPanel from '@/components/workspace/ChatPanel';
import ActivityPanel from '@/components/workspace/ActivityPanel';
import WorkspaceHeader from '@/components/workspace/WorkspaceHeader';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import LiveCursors from '@/components/workspace/LiveCursors';

export default function WorkspacePage() {
  const { workspace, sendCursorMove, activeFile } = useWorkspace();

  useEffect(() => {
    let ctrlKPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      // Ctrl+S
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('workspace:save'));
      }

      // Ctrl+O
      if ((e.ctrlKey || e.metaKey) && key === 'o' && !ctrlKPressed) {
        e.preventDefault();
        toast.info("File upload dialog coming soon!");
      }

      // Ctrl+K
      if ((e.ctrlKey || e.metaKey) && key === 'k') {
        e.preventDefault();
        ctrlKPressed = true;
        setTimeout(() => { ctrlKPressed = false; }, 1000);
        return;
      }

      // Ctrl+K Ctrl+O
      if (ctrlKPressed && (e.ctrlKey || e.metaKey) && key === 'o') {
        e.preventDefault();
        ctrlKPressed = false;
        toast.info("Workspace folder import coming soon!");
      }

      // Ctrl+P (Go to File)
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && key === 'p') {
        e.preventDefault();
        toast.info("File search coming soon!");
      }

      // Ctrl+Shift+P (Command Palette)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && key === 'p') {
        e.preventDefault();
        toast.info("Command palette coming soon!");
      }

      // Ctrl+Shift+~ (Toggle Terminal)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (key === '`' || key === '~')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('workspace:toggle-terminal'));
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

  const lastSentRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);

  const flushMouseMove = useCallback(() => {
    rafRef.current = null;
    if (!pendingRef.current) return;

    const now = Date.now();
    if (now - lastSentRef.current < 32) {
      rafRef.current = window.requestAnimationFrame(flushMouseMove);
      return;
    }

    sendCursorMove(pendingRef.current.x, pendingRef.current.y);
    lastSentRef.current = now;
  }, [sendCursorMove]);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      pendingRef.current = { x: event.clientX, y: event.clientY };
      if (rafRef.current == null) {
        rafRef.current = window.requestAnimationFrame(flushMouseMove);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [flushMouseMove]);

  if (!workspace) return null;

  return (
    <div className="relative h-screen flex flex-col overflow-hidden">
      <WorkspaceHeader />
      <LiveCursors />
      <div className="flex-1 flex overflow-hidden">
        <div className="w-60 shrink-0">
          <FileExplorer />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="relative flex-1 min-h-0 flex flex-col">
            <CodeEditor key={workspace.id + (activeFile?.id || 'none')} />
          </div>
          <TerminalPanel />
        </div>
        <ActivityPanel />
        <ChatPanel />
      </div>
    </div>
  );
}
