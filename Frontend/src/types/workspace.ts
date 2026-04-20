export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  content?: string;
  path: string;
  language?: string;
  lastModified?: Date;
  modifiedBy?: string;
}

export interface Workspace {
  id: string;
  name: string;
  createdAt: Date;
  files: FileNode[];
}

export interface ActivityEntry {
  id: string;
  user: string;
  action: 'created' | 'edited' | 'deleted' | 'uploaded' | 'renamed' | 'moved' | 'saved';
  target: string;
  timestamp: Date;
  avatar?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  activeFile?: string;
  isOnline: boolean;
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
    c: 'c', h: 'c',
    cpp: 'cpp', cxx: 'cpp', cc: 'cpp', hpp: 'cpp',
    java: 'java', cs: 'csharp',
    php: 'php',
    html: 'html', css: 'css', scss: 'scss',
    json: 'json', md: 'markdown', yml: 'yaml', yaml: 'yaml',
    sh: 'shell', sql: 'sql', xml: 'xml',
  };
  return map[ext] || 'plaintext';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}
