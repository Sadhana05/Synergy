import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

export default function LiveCursors() {
  const { remoteCursors } = useWorkspace();
  const [renderPositions, setRenderPositions] = useState<Record<string, { x: number; y: number }>>({});
  const targetsRef = useRef<Record<string, { x: number; y: number }>>({});
  const positionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const nextTargets: Record<string, { x: number; y: number }> = {};
    Object.entries(remoteCursors).forEach(([id, cursor]) => {
      nextTargets[id] = { x: cursor.x, y: cursor.y };
      if (!positionsRef.current[id]) {
        positionsRef.current[id] = { x: cursor.x, y: cursor.y };
      }
    });
    targetsRef.current = nextTargets;

    Object.keys(positionsRef.current).forEach((id) => {
      if (!nextTargets[id]) {
        delete positionsRef.current[id];
      }
    });
  }, [remoteCursors]);

  useEffect(() => {
    const tick = () => {
      const next: Record<string, { x: number; y: number }> = { ...positionsRef.current };
      let changed = false;

      Object.entries(targetsRef.current).forEach(([id, target]) => {
        const current = next[id] || target;
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const dist = Math.abs(dx) + Math.abs(dy);

        if (dist < 0.35) {
          if (current.x !== target.x || current.y !== target.y) {
            next[id] = { x: target.x, y: target.y };
            changed = true;
          }
          return;
        }

        next[id] = {
          x: current.x + dx * 0.28,
          y: current.y + dy * 0.28,
        };
        changed = true;
      });

      if (changed) {
        positionsRef.current = next;
        setRenderPositions(next);
      }

      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const visibleCursors = useMemo(() => Object.entries(remoteCursors), [remoteCursors]);

  if (!visibleCursors.length) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-[120] overflow-hidden">
      <style>{`
        @keyframes docs-cursor-in {
          0% { opacity: 0; transform: scale(0.9); }
          100% { opacity: 1; transform: scale(1); }
        }

        .live-cursor {
          position: absolute;
          transition: opacity 120ms ease;
          will-change: transform, opacity;
          animation: docs-cursor-in 120ms ease-out;
        }

        .canva-cursor-wrap {
          position: relative;
          transform: translate(3px, 3px);
        }

        .canva-pointer {
          width: 16px;
          height: 18px;
          filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.35));
        }

        .canva-label {
          position: absolute;
          left: 12px;
          top: -14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          max-width: 170px;
          padding: 3px 8px;
          border-radius: 8px;
          color: #fff;
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1;
        }

        .canva-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.92);
          flex-shrink: 0;
        }
      `}</style>

      {visibleCursors.map(([id, cursor]) => {
        const pos = renderPositions[id] || { x: cursor.x, y: cursor.y };
        const isIdle = cursor.status === 'idle';
        return (
        <div
          key={id}
          className="live-cursor"
          style={{
            transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
            opacity: isIdle ? 0.65 : 1,
          }}
        >
          <div className="canva-cursor-wrap">
            <svg className="canva-pointer" viewBox="0 0 20 22" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 1L2 19L7.8 13.8L11.2 20L14.2 18.5L10.9 12.3H18L2 1Z" fill={cursor.color} stroke="rgba(255,255,255,0.95)" strokeWidth="1" />
            </svg>
            <span className="canva-label" style={{ backgroundColor: cursor.color }}>
              <span className="canva-status-dot" />
              {cursor.name || getInitials(cursor.name)}
            </span>
          </div>
        </div>
      );
      })}
    </div>
  );
}
