import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { FileNode, ActivityEntry, Collaborator, generateId, getLanguageFromFilename } from '@/types/workspace';
import {
  workspaceService,
  WorkspaceSummary,
  WorkspaceDetails,
  WorkspaceMember,
  WorkspaceRole,
} from '@/services/workspaceService';
import { useAuth } from '@/context/AuthContext';
import type { LiveShareMember } from '@/components/workspace/LiveShareDialog';
import { COLLAB_SERVER_URL } from '@/config/env';
import { WebsocketProvider } from 'y-websocket';
import * as Y from 'yjs';

type PresenceStatus = 'active' | 'idle';

type PresenceUser = {
  id: string;
  name: string;
  color: string;
  status: PresenceStatus;
};

type WorkspaceContextType = {
  workspace: WorkspaceSummary | null;
  createWorkspace: (name: string, templateId?: string) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  files: FileNode[];
  openFiles: FileNode[];
  activeFile: FileNode | null;
  currentPath: string;
  activity: ActivityEntry[];
  collaborators: Collaborator[];
  createFile: (parentPath: string, name: string) => Promise<void>;
  createFolder: (parentPath: string, name: string) => Promise<void>;
  renameNode: (path: string, nextName: string) => Promise<void>;
  moveNode: (sourcePath: string, destFolderPath: string) => Promise<void>;
  openFile: (file: FileNode) => void;
  closeFile: (fileId: string) => void;
  setActiveFile: (file: FileNode) => void;
  updateFileContent: (fileId: string, content: string) => void;
  deleteNode: (path: string) => Promise<void>;
  setCurrentPath: (path: string) => void;
  uploadFiles: (files: File[], parentPath: string) => Promise<void>;
  workspaces: WorkspaceSummary[];
  loadWorkspaces: () => Promise<void>;
  selectWorkspace: (workspace: WorkspaceSummary) => Promise<void>;
  isLoading: boolean;
  saveWorkspace: () => Promise<void>;
  isSaving: boolean;
  liveMembers: LiveShareMember[];
  shareLink: string;
  addLiveMember: (email: string, role?: 'editor' | 'viewer') => Promise<void>;
  removeLiveMember: (id: string) => void;
  showShareDialog: boolean;
  setShowShareDialog: (show: boolean) => void;
  workspaceRole: WorkspaceRole | null;
  presenceUsers: PresenceUser[];
  remoteCursors: Record<string, { x: number; y: number; name: string; color: string; status: PresenceStatus; timestamp: number }>;
  sendCursorMove: (x: number, y: number) => void;
  updatePresenceCursor: (line: number, column: number) => void;
};

type CursorPresence = {
  x: number;
  y: number;
  name: string;
  color: string;
  status: PresenceStatus;
  timestamp: number;
};

type AwarenessPresenceState = {
  user?: { id: string; name: string; color: string };
  status?: PresenceStatus;
  cursor?: { line: number; column: number };
  mouse?: { x: number; y: number };
  lastActiveAt?: number;
};

const fallbackWorkspaceContext: WorkspaceContextType = {
  workspace: null,
  createWorkspace: async () => {},
  deleteWorkspace: async () => {},
  files: [],
  openFiles: [],
  activeFile: null,
  currentPath: '/',
  activity: [],
  collaborators: [],
  createFile: async () => {},
  createFolder: async () => {},
  renameNode: async () => {},
  moveNode: async () => {},
  openFile: () => {},
  closeFile: () => {},
  setActiveFile: () => {},
  updateFileContent: () => {},
  deleteNode: async () => {},
  setCurrentPath: () => {},
  uploadFiles: async () => {},
  workspaces: [],
  loadWorkspaces: async () => {},
  selectWorkspace: async () => {},
  isLoading: false,
  saveWorkspace: async () => {},
  isSaving: false,
  liveMembers: [],
  shareLink: '',
  addLiveMember: async () => {},
  removeLiveMember: () => {},
  showShareDialog: false,
  setShowShareDialog: () => {},
  workspaceRole: null,
  presenceUsers: [],
  remoteCursors: {},
  sendCursorMove: () => {},
  updatePresenceCursor: () => {},
};

const WorkspaceContext = createContext<WorkspaceContextType>(fallbackWorkspaceContext);

export function useWorkspace() {
  return useContext(WorkspaceContext);
}

const toFileNode = (node: any): FileNode => ({
  id: node.id,
  name: node.name,
  type: node.type,
  path: node.path,
  content: node.content || '',
  language: node.language || getLanguageFromFilename(node.name),
  lastModified: node.updatedAt ? new Date(node.updatedAt) : undefined,
  modifiedBy: undefined,
  children: (node.children || []).map((child: any) => toFileNode(child)),
});

const flattenFiles = (nodes: FileNode[]): FileNode[] => {
  const output: FileNode[] = [];
  const walk = (list: FileNode[]) => {
    list.forEach((node) => {
      output.push(node);
      if (node.children?.length) walk(node.children);
    });
  };
  walk(nodes);
  return output;
};

const mapActivity = (row: any): ActivityEntry => ({
  id: row.id,
  user: row.username,
  action: row.action?.includes('deleted')
    ? 'deleted'
    : row.action?.includes('edited') || row.action?.includes('updated')
      ? 'edited'
      : row.action?.includes('uploaded')
        ? 'uploaded'
        : row.action?.includes('moved')
          ? 'moved'
          : row.action?.includes('saved') || row.action?.includes('snapshot')
            ? 'saved'
            : 'created',
  target: row.target,
  timestamp: new Date(row.created_at),
});

const mapCollaborators = (members: WorkspaceMember[], onlineUserIds: Set<string>): Collaborator[] => {
  return members.map((member) => ({
    id: member.user_id,
    name: member.username,
    color: `hsl(${Math.floor((member.username.charCodeAt(0) * 37) % 360)}, 75%, 60%)`,
    avatar: undefined,
    isOnline: onlineUserIds.has(member.user_id),
  }));
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openFiles, setOpenFiles] = useState<FileNode[]>([]);
  const [activeFile, setActiveFileState] = useState<FileNode | null>(null);
  const [currentPath, setCurrentPath] = useState('/');
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole | null>(null);
  const [liveMembers, setLiveMembers] = useState<LiveShareMember[]>([]);
  const [shareLink, setShareLink] = useState('');
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<Record<string, CursorPresence>>({});
  const pendingContent = useRef<Map<string, string>>(new Map());
  const pendingTimer = useRef<number | null>(null);
  const autoSyncBusy = useRef(false);
  const presenceDocRef = useRef<Y.Doc | null>(null);
  const presenceProviderRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<WebsocketProvider['awareness'] | null>(null);
  const localIdleTimerRef = useRef<number | null>(null);

  const applyWorkspaceDetails = useCallback((details: WorkspaceDetails, summary?: WorkspaceSummary, currentOnlineIds?: Set<string>) => {
    const fileTree = (details.files || []).map((node) => toFileNode(node));
    setFiles(fileTree);
    const refreshedById = new Map(flattenFiles(fileTree).map((node) => [node.id, node]));
    setOpenFiles((prev) => prev.map((file) => refreshedById.get(file.id) || file));
    setActiveFileState((prev) => {
      if (!prev) return prev;
      return refreshedById.get(prev.id) || prev;
    });
    setActivity((details.activity || []).map(mapActivity));
    setCollaborators(mapCollaborators(details.members || [], currentOnlineIds || onlineUserIds));
    const role = details.members.find((m) => m.user_id === user?.id)?.role || summary?.role || null;
    setWorkspaceRole(role);

    if (summary) {
      setWorkspace(summary);
      setCurrentPath(`/${summary.name}`);
    }

    setLiveMembers(
      (details.members || []).map((member) => ({
        id: member.user_id,
        email: member.email,
        isOnline: (currentOnlineIds || onlineUserIds).has(member.user_id),
        location: details.name,
        status: member.role,
      }))
    );
  }, [user?.id, onlineUserIds]);

  const loadWorkspaces = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const rows = await workspaceService.getWorkspaces();
      setWorkspaces(rows);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!workspace || !user) return;

    const yDoc = new Y.Doc();
    const room = `workspace_presence_${workspace.id}`;
    const provider = new WebsocketProvider(`${COLLAB_SERVER_URL}/${room}`, room, yDoc);
    const awareness = provider.awareness;

    presenceDocRef.current = yDoc;
    presenceProviderRef.current = provider;
    awarenessRef.current = awareness;

    const colorSeed = `${user.id}:${user.username || user.email || 'collaborator'}`;
    const hue = Array.from(colorSeed).reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360;

    const setLocalStatus = (status: PresenceStatus) => {
      const prev = (awareness.getLocalState() || {}) as AwarenessPresenceState;
      awareness.setLocalState({
        ...prev,
        user: prev.user || {
          id: user.id,
          name: user.username || user.email || 'Collaborator',
          color: `hsl(${hue}, 80%, 58%)`,
        },
        status,
        lastActiveAt: Date.now(),
      });
    };

    const markActive = () => {
      setLocalStatus('active');
      if (localIdleTimerRef.current) {
        window.clearTimeout(localIdleTimerRef.current);
      }
      localIdleTimerRef.current = window.setTimeout(() => {
        setLocalStatus('idle');
      }, 15000);
    };

    const applyAwarenessState = () => {
      const nextRemote: Record<string, CursorPresence> = {};
      const nextUsers: PresenceUser[] = [];
      const onlineIds = new Set<string>();

      awareness.getStates().forEach((state) => {
        const presence = state as AwarenessPresenceState;
        if (!presence.user?.id) return;

        const status: PresenceStatus = presence.status || 'active';
        const normalizedUser: PresenceUser = {
          id: presence.user.id,
          name: presence.user.name,
          color: presence.user.color,
          status,
        };

        nextUsers.push(normalizedUser);
        onlineIds.add(normalizedUser.id);

        if (normalizedUser.id === user.id) return;
        if (typeof presence.mouse?.x !== 'number' || typeof presence.mouse?.y !== 'number') return;

        nextRemote[normalizedUser.id] = {
          x: presence.mouse.x,
          y: presence.mouse.y,
          name: normalizedUser.name,
          color: normalizedUser.color,
          status,
          timestamp: Date.now(),
        };
      });

      setPresenceUsers(nextUsers);
      setOnlineUserIds(onlineIds);

      setCollaborators((prev) => prev.map((c) => ({
        ...c,
        isOnline: onlineIds.has(c.id),
      })));

      setLiveMembers((prev) => prev.map((m) => ({
        ...m,
        isOnline: onlineIds.has(m.id),
      })));

      setRemoteCursors(nextRemote);
    };

    awareness.setLocalState({
      user: {
        id: user.id,
        name: user.username || user.email || 'Collaborator',
        color: `hsl(${hue}, 80%, 58%)`,
      },
      status: 'active',
      cursor: { line: 1, column: 1 },
      mouse: { x: 0, y: 0 },
      lastActiveAt: Date.now(),
    } satisfies AwarenessPresenceState);

    markActive();
    applyAwarenessState();
    awareness.on('change', applyAwarenessState);

    return () => {
      awareness.off('change', applyAwarenessState);
      awareness.setLocalState(null);
      if (localIdleTimerRef.current) {
        window.clearTimeout(localIdleTimerRef.current);
      }
      setPresenceUsers([]);
      setRemoteCursors({});
      provider.destroy();
      yDoc.destroy();
      awarenessRef.current = null;
      presenceProviderRef.current = null;
      presenceDocRef.current = null;
    };
  }, [workspace?.id, user?.id, user?.username, user?.email]);

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
      setOnlineUserIds(new Set([user.id]));
    } else {
      setWorkspaces([]);
      setWorkspace(null);
      setFiles([]);
      setOpenFiles([]);
      setActiveFileState(null);
      setActivity([]);
      setCollaborators([]);
      setWorkspaceRole(null);
      setOnlineUserIds(new Set());
    }
  }, [user, loadWorkspaces]);

  const selectWorkspace = useCallback(async (selectedWorkspace: WorkspaceSummary) => {
    const details = await workspaceService.getWorkspace(selectedWorkspace.id);
    setWorkspace(selectedWorkspace);
    setOpenFiles([]);
    setActiveFileState(null);
    applyWorkspaceDetails(details, selectedWorkspace);
  }, [applyWorkspaceDetails]);

  const createWorkspace = useCallback(async (name: string, templateId?: string) => {
    setIsLoading(true);
    try {
      const created = await workspaceService.createWorkspace({ name, templateId });
      setWorkspaces((prev) => [created, ...prev]);
      await selectWorkspace(created);
    } finally {
      setIsLoading(false);
    }
  }, [selectWorkspace]);

  const deleteWorkspace = useCallback(async (id: string) => {
    await workspaceService.deleteWorkspace(id);
    setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    if (workspace?.id === id) {
      setWorkspace(null);
      setFiles([]);
      setOpenFiles([]);
      setActiveFileState(null);
      setActivity([]);
      setCollaborators([]);
      setWorkspaceRole(null);
      setCurrentPath('/');
    }
  }, [workspace?.id]);

  const resolveParentId = useCallback((parentPath: string): string | null => {
    if (!parentPath || parentPath === '/' || parentPath === `/${workspace?.name}`) return null;
    const all = flattenFiles(files);
    const folder = all.find((f) => f.path === parentPath && f.type === 'folder');
    return folder?.id || null;
  }, [files, workspace?.name]);

  const refreshWorkspace = useCallback(async () => {
    if (!workspace) return;
    const details = await workspaceService.getWorkspace(workspace.id);
    applyWorkspaceDetails(details, workspace);
  }, [workspace, applyWorkspaceDetails]);

  useEffect(() => {
    if (!workspace) return;

    let disposed = false;

    const syncNow = async () => {
      if (disposed || autoSyncBusy.current) return;
      if (pendingContent.current.size > 0) return;

      autoSyncBusy.current = true;
      try {
        const details = await workspaceService.getWorkspace(workspace.id);
        if (!disposed) {
          applyWorkspaceDetails(details, workspace);
        }
      } catch {
        // Ignore transient polling failures; next cycle will retry.
      } finally {
        autoSyncBusy.current = false;
      }
    };

    void syncNow();
    const timer = window.setInterval(() => {
      void syncNow();
    }, 1500);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [workspace, applyWorkspaceDetails]);

  const createFile = useCallback(async (parentPath: string, name: string) => {
    if (!workspace) return;
    const parentId = resolveParentId(parentPath);
    await workspaceService.createNode(workspace.id, {
      parentId,
      name,
      type: 'file',
      content: '',
    });
    await refreshWorkspace();
  }, [refreshWorkspace, resolveParentId, workspace]);

  const createFolder = useCallback(async (parentPath: string, name: string) => {
    if (!workspace) return;
    const parentId = resolveParentId(parentPath);
    await workspaceService.createNode(workspace.id, {
      parentId,
      name,
      type: 'folder',
    });
    await refreshWorkspace();
  }, [refreshWorkspace, resolveParentId, workspace]);

  const moveNode = useCallback(async (sourcePath: string, destFolderPath: string) => {
    const all = flattenFiles(files);
    const source = all.find((f) => f.path === sourcePath);
    if (!source) return;
    const parentId = resolveParentId(destFolderPath);
    await workspaceService.updateNode(source.id, { parentId });
    await refreshWorkspace();
  }, [files, refreshWorkspace, resolveParentId]);

  const renameNode = useCallback(async (path: string, nextName: string) => {
    const all = flattenFiles(files);
    const node = all.find((f) => f.path === path);
    if (!node || !nextName.trim()) return;
    await workspaceService.updateNode(node.id, { name: nextName.trim() });
    await refreshWorkspace();
  }, [files, refreshWorkspace]);

  const openFile = useCallback((file: FileNode) => {
    if (file.type !== 'file') return;
    setOpenFiles((prev) => (prev.some((f) => f.id === file.id) ? prev : [...prev, file]));
    setActiveFileState(file);
    setCurrentPath(file.path.substring(0, file.path.lastIndexOf('/')) || '/');
  }, []);

  const closeFile = useCallback((fileId: string) => {
    setOpenFiles((prev) => {
      const next = prev.filter((f) => f.id !== fileId);
      if (activeFile?.id === fileId) {
        setActiveFileState(next[next.length - 1] || null);
      }
      return next;
    });
  }, [activeFile?.id]);

  const setActiveFile = useCallback((file: FileNode) => {
    setActiveFileState(file);
  }, []);

  const flushPendingContent = useCallback(async () => {
    const updates = Array.from(pendingContent.current.entries());
    pendingContent.current.clear();
    await Promise.all(
      updates.map(([fileId, content]) => workspaceService.updateNode(fileId, { content }))
    );
  }, []);

  const scheduleFlush = useCallback(() => {
    if (pendingTimer.current) {
      window.clearTimeout(pendingTimer.current);
    }
    pendingTimer.current = window.setTimeout(() => {
      void flushPendingContent();
      pendingTimer.current = null;
    }, 500);
  }, [flushPendingContent]);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    const patchTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((node) => {
        if (node.id === fileId) {
          return { ...node, content, lastModified: new Date() };
        }
        if (node.children?.length) {
          return { ...node, children: patchTree(node.children) };
        }
        return node;
      });

    setFiles((prev) => patchTree(prev));
    setOpenFiles((prev) => prev.map((f) => (f.id === fileId ? { ...f, content, lastModified: new Date() } : f)));
    setActiveFileState((prev) => (prev?.id === fileId ? { ...prev, content, lastModified: new Date() } : prev));

    pendingContent.current.set(fileId, content);
    scheduleFlush();
  }, [scheduleFlush]);

  const deleteNode = useCallback(async (path: string) => {
    const all = flattenFiles(files);
    const node = all.find((f) => f.path === path);
    if (!node) return;
    await workspaceService.deleteNode(node.id);
    await refreshWorkspace();
    setOpenFiles((prev) => prev.filter((f) => !f.path.startsWith(path)));
  }, [files, refreshWorkspace]);

  const uploadFiles = useCallback(async (uploadedFiles: File[], parentPath: string) => {
    if (!workspace) return;

    const ignoredSegments = new Set(['node_modules', '.git', '.next', '.turbo', 'dist', 'build', 'out']);

    const normalizeFolderPath = (value: string): string => {
      if (!value || value === '/' || value === `/${workspace.name}`) {
        return '/';
      }
      const normalized = value.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/\/$/, '');
      return normalized.startsWith('/') ? normalized : `/${normalized}`;
    };

    const fullTree = flattenFiles(files);
    const folderIdByPath = new Map<string, string>();
    fullTree
      .filter((node) => node.type === 'folder')
      .forEach((folder) => {
        folderIdByPath.set(normalizeFolderPath(folder.path), folder.id);
      });

    const baseFolderPath = normalizeFolderPath(parentPath);
    const rootParentId = resolveParentId(parentPath);

    const ensureFolder = async (folderPath: string): Promise<string | null> => {
      const normalizedFolderPath = normalizeFolderPath(folderPath);
      if (normalizedFolderPath === '/') {
        return null;
      }

      const existing = folderIdByPath.get(normalizedFolderPath);
      if (existing) {
        return existing;
      }

      const parentSegments = normalizedFolderPath.split('/').filter(Boolean);
      const folderName = parentSegments.pop();
      if (!folderName) {
        return null;
      }

      const parentFolderPath = parentSegments.length ? `/${parentSegments.join('/')}` : '/';
      const parentId = await ensureFolder(parentFolderPath);
      const created = await workspaceService.createNode(workspace.id, {
        parentId: parentFolderPath === '/' ? rootParentId : parentId,
        name: folderName,
        type: 'folder',
      });
      folderIdByPath.set(normalizedFolderPath, created.id);
      return created.id;
    };

    for (const file of uploadedFiles) {
      const relativePath = ((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
        .replace(/\\/g, '/')
        .replace(/^\/+/, '');
      if (!relativePath) {
        continue;
      }

      const segments = relativePath.split('/').filter(Boolean);
      if (segments.some((segment) => ignoredSegments.has(segment.toLowerCase()))) {
        continue;
      }

      const fileName = segments.pop();
      if (!fileName) {
        continue;
      }

      let parentId = rootParentId;
      if (segments.length) {
        const nestedFolderPath = `${baseFolderPath === '/' ? '' : baseFolderPath}/${segments.join('/')}`;
        parentId = await ensureFolder(nestedFolderPath);
      }

      const content = await file.text();
      await workspaceService.createNode(workspace.id, {
        parentId,
        name: fileName,
        type: 'file',
        content,
      });
    }
    await refreshWorkspace();
  }, [files, refreshWorkspace, resolveParentId, workspace]);

  const saveWorkspace = useCallback(async () => {
    if (!workspace) return;
    setIsSaving(true);
    try {
      await flushPendingContent();
      await workspaceService.createSnapshot(workspace.id, `Manual save ${new Date().toLocaleString()}`);
      await refreshWorkspace();
    } finally {
      setIsSaving(false);
    }
  }, [flushPendingContent, refreshWorkspace, workspace]);

  const addLiveMember = useCallback(async (email: string, role: 'editor' | 'viewer' = 'editor') => {
    if (!workspace) return;
    const result = await workspaceService.inviteMember(workspace.id, email, role);
    if (result.inviteToken) {
      setShareLink(`${window.location.origin}/workspace?invite=${result.inviteToken}`);
    }
    await refreshWorkspace();
  }, [refreshWorkspace, workspace]);

  const removeLiveMember = useCallback((id: string) => {
    setLiveMembers((prev) => prev.filter((m) => m.id !== id));
    setCollaborators((prev) => prev.filter((c) => c.id !== id));
    setRemoteCursors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const sendCursorMove = useCallback((x: number, y: number) => {
    const awareness = awarenessRef.current;
    if (!awareness) return;
    const prev = (awareness.getLocalState() || {}) as AwarenessPresenceState;
    if (localIdleTimerRef.current) {
      window.clearTimeout(localIdleTimerRef.current);
    }
    awareness.setLocalState({
      ...prev,
      mouse: { x, y },
      status: 'active',
      lastActiveAt: Date.now(),
    });
    localIdleTimerRef.current = window.setTimeout(() => {
      const current = (awareness.getLocalState() || {}) as AwarenessPresenceState;
      awareness.setLocalState({
        ...current,
        status: 'idle',
      });
    }, 15000);
  }, []);

  const updatePresenceCursor = useCallback((line: number, column: number) => {
    const awareness = awarenessRef.current;
    if (!awareness) return;
    const prev = (awareness.getLocalState() || {}) as AwarenessPresenceState;
    if (localIdleTimerRef.current) {
      window.clearTimeout(localIdleTimerRef.current);
    }
    awareness.setLocalState({
      ...prev,
      cursor: { line, column },
      status: 'active',
      lastActiveAt: Date.now(),
    });
    localIdleTimerRef.current = window.setTimeout(() => {
      const current = (awareness.getLocalState() || {}) as AwarenessPresenceState;
      awareness.setLocalState({
        ...current,
        status: 'idle',
      });
    }, 15000);
  }, []);

  const value = useMemo<WorkspaceContextType>(
    () => ({
      workspace,
      createWorkspace,
      deleteWorkspace,
      files,
      openFiles,
      activeFile,
      currentPath,
      activity,
      collaborators,
      createFile,
      createFolder,
      renameNode,
      moveNode,
      openFile,
      closeFile,
      setActiveFile,
      updateFileContent,
      deleteNode,
      setCurrentPath,
      uploadFiles,
      workspaces,
      loadWorkspaces,
      selectWorkspace,
      isLoading,
      saveWorkspace,
      isSaving,
      liveMembers,
      shareLink,
      addLiveMember,
      removeLiveMember,
      showShareDialog,
      setShowShareDialog,
      workspaceRole,
      presenceUsers,
      remoteCursors,
      sendCursorMove,
      updatePresenceCursor,
    }),
    [
      workspace,
      createWorkspace,
      deleteWorkspace,
      files,
      openFiles,
      activeFile,
      currentPath,
      activity,
      collaborators,
      createFile,
      createFolder,
      renameNode,
      moveNode,
      openFile,
      closeFile,
      setActiveFile,
      updateFileContent,
      deleteNode,
      uploadFiles,
      workspaces,
      loadWorkspaces,
      selectWorkspace,
      isLoading,
      saveWorkspace,
      isSaving,
      liveMembers,
      shareLink,
      addLiveMember,
      removeLiveMember,
      showShareDialog,
      workspaceRole,
      presenceUsers,
      remoteCursors,
      sendCursorMove,
      updatePresenceCursor,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
