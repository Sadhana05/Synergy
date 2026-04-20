import { API_BASE_URL } from '@/config/env';
import { authService } from './authService';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceSummary {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  role: WorkspaceRole;
}

export interface WorkspaceMember {
  user_id: string;
  username: string;
  email: string;
  role: WorkspaceRole;
}

export interface WorkspaceActivity {
  id: string;
  action: string;
  target: string;
  username: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface FileNodeDto {
  id: string;
  parentId?: string | null;
  workspaceId?: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  language?: string;
  createdAt?: string;
  updatedAt?: string;
  children?: FileNodeDto[];
}

export interface WorkspaceDetails {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
  files: FileNodeDto[];
  members: WorkspaceMember[];
  activity: WorkspaceActivity[];
}

export interface Snapshot {
  id: string;
  message: string;
  created_at: string;
  username?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  username: string;
  user_id: string;
}

export interface TemplateInfo {
  id: string;
  name: string;
}

export interface DeployResult {
  deploymentId: string;
  url: string;
  fileCount: number;
  mode?: 'static' | 'node-build';
  framework?: string;
}

class WorkspaceService {
  private getAuthHeader() {
    const token = authService.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
        ...(init.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.message || result?.error?.message || 'Request failed');
    }

    return result.data as T;
  }

  getWorkspaces(): Promise<WorkspaceSummary[]> {
    return this.request('/workspaces');
  }

  createWorkspace(payload: { name: string; templateId?: string }): Promise<WorkspaceSummary> {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  getWorkspace(id: string): Promise<WorkspaceDetails> {
    return this.request(`/workspaces/${id}`).catch(async (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Request failed';
      // Backward compatibility for older backend that only exposes GET /workspaces.
      if (message.toLowerCase().includes('route not found')) {
        const all = await this.getWorkspaces();
        const ws = all.find((row) => row.id === id);
        if (ws) {
          return {
            id: ws.id,
            name: ws.name,
            owner_id: ws.owner_id,
            created_at: ws.created_at,
            updated_at: ws.updated_at || ws.created_at,
            files: [],
            members: [],
            activity: [],
          };
        }
      }

      throw error;
    });
  }

  deleteWorkspace(id: string): Promise<void> {
    return this.request(`/workspaces/${id}`, { method: 'DELETE' });
  }

  getTemplates(): Promise<TemplateInfo[]> {
    return this.request('/templates');
  }

  createNode(
    workspaceId: string,
    payload: { parentId?: string | null; name: string; type: 'file' | 'folder'; content?: string }
  ): Promise<FileNodeDto> {
    return this.request(`/workspaces/${workspaceId}/files`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  updateNode(
    fileId: string,
    payload: { name?: string; parentId?: string | null; content?: string }
  ): Promise<FileNodeDto> {
    return this.request(`/files/${fileId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  deleteNode(fileId: string): Promise<void> {
    return this.request(`/files/${fileId}`, { method: 'DELETE' });
  }

  createSnapshot(workspaceId: string, message: string): Promise<Snapshot> {
    return this.request(`/workspaces/${workspaceId}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  getSnapshots(workspaceId: string): Promise<Snapshot[]> {
    return this.request(`/workspaces/${workspaceId}/snapshots`);
  }

  restoreSnapshot(workspaceId: string, snapshotId: string): Promise<void> {
    return this.request(`/workspaces/${workspaceId}/snapshots/${snapshotId}/restore`, {
      method: 'POST',
    });
  }

  getActivity(workspaceId: string): Promise<WorkspaceActivity[]> {
    return this.request(`/workspaces/${workspaceId}/activity`);
  }

  getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    return this.request(`/workspaces/${workspaceId}/members`);
  }

  inviteMember(workspaceId: string, email: string, role: 'editor' | 'viewer') {
    return this.request<{ accepted: boolean; inviteToken?: string }>(`/workspaces/${workspaceId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  getChatHistory(workspaceId: string): Promise<ChatMessage[]> {
    return this.request(`/workspaces/${workspaceId}/chat`);
  }

  async runAiTask(payload: {
    taskType: 'explain' | 'fix' | 'refactor' | 'tests' | 'chat';
    code: string;
    language?: string;
    context?: string;
  }): Promise<string> {
    const data = await this.request<{ result: string }>('/ai/assist', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return data.result;
  }

  async runAiChat(message: string, workspaceId?: string): Promise<string> {
    try {
      const data = await this.request<{ result: string }>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message, workspaceId }),
      });

      return data.result;
    } catch (error) {
      const msg = error instanceof Error ? error.message.toLowerCase() : '';
      if (!msg.includes('route not found')) {
        throw error;
      }

      const fallback = await this.request<{ result: string }>('/ai/assist', {
        method: 'POST',
        body: JSON.stringify({
          taskType: 'chat',
          code: message,
          language: 'text',
          context: workspaceId ? `workspace-chat:${workspaceId}` : 'workspace-chat',
        }),
      });

      return fallback.result;
    }
  }

  async runAiAction(payload: {
    workspaceId: string;
    requestId: string;
    action: 'explain' | 'fix' | 'refactor' | 'tests';
    code: string;
    language?: string;
    context?: string;
  }): Promise<{ requestId: string }> {
    return this.request<{ requestId: string }>('/ai/action', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  deployWorkspace(workspaceId: string): Promise<DeployResult> {
    return this.request(`/workspaces/${workspaceId}/deploy`, {
      method: 'POST',
    });
  }
}

export const workspaceService = new WorkspaceService();
