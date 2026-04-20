import { useState, useRef } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FilePlus, FolderPlus, Upload, Trash2, Pencil } from 'lucide-react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { FileNode } from '@/types/workspace';

const folderPickerAttrs = {
  webkitdirectory: '',
  directory: '',
} as const;

function FileTreeItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { openFile, activeFile, setCurrentPath, deleteNode, moveNode, renameNode } = useWorkspace();
  const isActive = activeFile?.id === node.id;

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
      setCurrentPath(node.path);
    } else {
      openFile(node);
    }
  };

  return (
    <div className="animate-slide-in-left">
      <div
        draggable
        onDragStart={e => e.dataTransfer.setData('text/plain', node.path)}
        onDragOver={e => {
          if (node.type === 'folder') {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          const source = e.dataTransfer.getData('text/plain');
          if (source && node.type === 'folder' && source !== node.path) {
            moveNode(source, node.path);
          }
        }}
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer text-sm group transition-colors duration-150
          ${isActive ? 'bg-ide-line-highlight text-foreground' : 'text-secondary-foreground hover:bg-muted/50'}
          ${dragOver ? 'bg-muted/30' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' ? (
          <>
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
            {isOpen ? <FolderOpen className="w-4 h-4 shrink-0 text-ide-warning" /> : <Folder className="w-4 h-4 shrink-0 text-ide-warning" />}
          </>
        ) : (
          <>
            <span className="w-3.5 shrink-0" />
            <File className="w-4 h-4 shrink-0 text-ide-info" />
          </>
        )}
        <span className="truncate ml-1">{node.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nextName = window.prompt('Rename', node.name);
            if (nextName && nextName !== node.name) {
              void renameNode(node.path, nextName);
            }
          }}
          title="Rename"
          className="ml-auto opacity-0 group-hover:opacity-100 p-0.5 hover:text-primary transition-opacity"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); deleteNode(node.path); }}
          title="Delete"
          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-destructive transition-opacity"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
      {node.type === 'folder' && isOpen && node.children && (
        <div>
          {node.children
            .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
            .map(child => (
              <FileTreeItem key={child.id} node={child} depth={depth + 1} />
            ))}
        </div>
      )}
    </div>
  );
}

export default function FileExplorer() {
  const { files, workspace, createFile, createFolder, currentPath, uploadFiles } = useWorkspace();
  const [showNewInput, setShowNewInput] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  // map extension to readable language name
  const extensionMap: Record<string, string> = {
    ts: 'TypeScript',
    tsx: 'TypeScript (JSX)',
    js: 'JavaScript',
    jsx: 'JavaScript (JSX)',
    py: 'Python',
    java: 'Java',
    rb: 'Ruby',
    go: 'Go',
    rs: 'Rust',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    md: 'Markdown',
    json: 'JSON',
    yaml: 'YAML',
    yml: 'YAML',
    xml: 'XML',
    php: 'PHP',
    sh: 'Shell',
    bat: 'Batch',
    txt: 'Text',
  };

  const getLanguageName = (name: string) => {
    const parts = name.split('.');
    if (parts.length < 2) return '';
    const ext = parts.pop()!.toLowerCase();
    return extensionMap[ext] || '';
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const basePath = currentPath || `/${workspace?.name || ''}`;

  const handleCreate = () => {
    if (!newName.trim()) { setShowNewInput(null); return; }
    if (showNewInput === 'file') {
      void createFile(basePath, newName.trim());
    } else {
      void createFolder(basePath, newName.trim());
    }
    setNewName('');
    setShowNewInput(null);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void uploadFiles(Array.from(e.target.files), basePath);
      e.target.value = '';
    }
  };

  const handleFolderUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      void uploadFiles(Array.from(e.target.files), basePath);
      e.target.value = '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-r border-border">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Explorer</span>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowNewInput('file')} className="p-1 hover:bg-muted rounded transition-colors" title="New File">
            <FilePlus className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button onClick={() => setShowNewInput('folder')} className="p-1 hover:bg-muted rounded transition-colors" title="New Folder">
            <FolderPlus className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="p-1 hover:bg-muted rounded transition-colors" title="Upload Files">
            <Upload className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <button onClick={() => folderInputRef.current?.click()} className="p-1 hover:bg-muted rounded transition-colors" title="Upload Folder">
            <FolderOpen className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            aria-label="Upload files"
            className="hidden"
            onChange={handleUpload}
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            aria-label="Upload folder"
            className="hidden"
            {...(folderPickerAttrs as any)}
            onChange={handleFolderUpload}
          />
        </div>
      </div>

      {showNewInput && (
        <div className="px-3 py-2 border-b border-border">
          <div className="flex items-center gap-2">
            {showNewInput === 'folder' ? <Folder className="w-4 h-4 text-ide-warning" /> : <File className="w-4 h-4 text-ide-info" />}
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowNewInput(null); }}
              onBlur={handleCreate}
              placeholder={showNewInput === 'file' ? 'filename.ts' : 'folder-name'}
              className="flex-1 bg-muted text-foreground text-sm px-2 py-1 rounded border border-primary/30 outline-none focus:border-primary"
            />
          </div>
          {showNewInput === 'file' && newName && (
            <div className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
              {/* extension badge acting as icon */}
              {newName.split('.').pop() && (
                <span className="font-mono text-[10px] bg-muted px-1 rounded">.{newName.split('.').pop()}</span>
              )}
              <span>Language: {getLanguageName(newName) || 'unknown'}</span>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-1">
        {workspace && (
          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {workspace.name}
          </div>
        )}
        {files
          .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1))
          .map(node => (
            <FileTreeItem key={node.id} node={node} />
          ))}
        {files.length === 0 && (
          <div className="px-4 py-8 text-center text-muted-foreground text-xs">
            No files yet. Create a file or folder to get started.
          </div>
        )}
      </div>
    </div>
  );
}
