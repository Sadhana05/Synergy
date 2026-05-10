import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createServer } from "http";
import { randomUUID } from "crypto";
import { spawn, spawnSync } from "child_process";
import * as path from "path";
import { promises as fs } from "fs";
import { WebSocketServer, WebSocket } from "ws";
import * as pty from "node-pty";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as decoding from "lib0/decoding";
import * as encoding from "lib0/encoding";
import { Collection, Document, Sort } from "mongodb";
import { connectDatabase, getDb } from "./config/database";
import { logger } from "./utils/logger";

dotenv.config();

// Handle unhandled promise rejections to prevent server crashes
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  // Don't exit the process, just log the error
});

// Database health check
const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await getDb().admin().ping();
    return true;
  } catch (error) {
    logger.error("Database health check failed", { error: error instanceof Error ? error.message : String(error) });
    return false;
  }
};

const app = express();
const server = createServer(app);

const PORT = Number(process.env.PORT || 3001);
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "https://synergy-p9ni.vercel.app";
const GROQ_BASE_URL = process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const DOCKER_TERMINAL_IMAGE = process.env.DOCKER_TERMINAL_IMAGE || "mcr.microsoft.com/devcontainers/universal:2";
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "");
const DEPLOYMENTS_ROOT = path.resolve(process.cwd(), ".deployments");
const DEPLOY_BUILD_TIMEOUT_MS = Number(process.env.DEPLOY_BUILD_TIMEOUT_MS || 300000);
const WS_DEV_AUTH_BYPASS = process.env.NODE_ENV !== "production";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
let cachedDockerAvailable: boolean | null = null;
let dockerFallbackLogged = false;

type Role = "owner" | "editor" | "viewer";

type AuthPayload = {
  userId: string;
  email: string;
};

type AuthRequest = Request & {
  user?: AuthPayload;
};

type UserDoc = {
  id: string;
  email: string;
  username: string;
  password_hash?: string;
  oauth_provider?: "google" | "github";
  oauth_id?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

type WorkspaceDoc = {
  id: string;
  name: string;
  owner_id: string;
  template_id?: string | null;
  created_at: string;
  updated_at: string;
};

type WorkspaceMemberDoc = {
  workspace_id: string;
  user_id: string;
  role: Role;
  created_at: string;
};

type WorkspaceInviteDoc = {
  id: string;
  workspace_id: string;
  email: string;
  role: "editor" | "viewer";
  token: string;
  status: "pending" | "accepted";
  invited_by: string;
  created_at: string;
};

type FileDoc = {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  type: "file" | "folder";
  path: string;
  content: string | null;
  language: string | null;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

type SnapshotDoc = {
  id: string;
  workspace_id: string;
  message: string;
  created_by: string;
  created_at: string;
};

type SnapshotFileDoc = {
  snapshot_id: string;
  file_id: string | null;
  path: string;
  type: "file" | "folder";
  name: string;
  content: string | null;
  language: string | null;
};

type WorkspaceActivityDoc = {
  id: string;
  workspace_id: string;
  user_id: string;
  action: string;
  target: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

type ChatMessageDoc = {
  id: string;
  workspace_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type ShareLinkDoc = {
  token: string;
  workspace_id: string;
  created_by: string;
  created_at: string;
};

type ChatClient = {
  socket: WebSocket;
  workspaceId: string;
  userId: string;
  username: string;
  activeResourceId: string | null;
};

type CollabRoom = {
  doc: Y.Doc;
  clients: Set<WebSocket>;
};

const chatRooms = new Map<string, Set<ChatClient>>();
const collabRooms = new Map<string, CollabRoom>();

const MESSAGE_SYNC = 0;
const roleRank: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };

const nowIso = (): string => new Date().toISOString();

const isDockerAvailable = (): boolean => {
  if (cachedDockerAvailable !== null) {
    return cachedDockerAvailable;
  }

  try {
    const checker = process.platform === "win32" ? "where" : "which";
    const result = spawnSync(checker, ["docker"], { stdio: "ignore" });
    cachedDockerAvailable = result.status === 0;
  } catch {
    cachedDockerAvailable = false;
  }

  return cachedDockerAvailable;
};

const collection = <T extends Document>(name: string): Collection<T> => {
  return getDb().collection<T>(name);
};

const usersCollection = () => collection<UserDoc>("users");
const workspacesCollection = () => collection<WorkspaceDoc>("workspaces");
const membersCollection = () => collection<WorkspaceMemberDoc>("workspace_members");
const invitesCollection = () => collection<WorkspaceInviteDoc>("workspace_invites");
const filesCollection = () => collection<FileDoc>("files");
const snapshotsCollection = () => collection<SnapshotDoc>("snapshots");
const snapshotFilesCollection = () => collection<SnapshotFileDoc>("snapshot_files");
const activityCollection = () => collection<WorkspaceActivityDoc>("workspace_activity");
const chatCollection = () => collection<ChatMessageDoc>("chat_messages");
const shareLinksCollection = () => collection<ShareLinkDoc>("share_links");

const getWorkspaceRuntimePath = (workspaceId: string): string => {
  return path.resolve(process.cwd(), ".workspace-runtime", workspaceId);
};

const getWorkspaceDeploymentPath = (deploymentId: string): string => {
  return path.resolve(DEPLOYMENTS_ROOT, deploymentId);
};

type DeploymentMeta = {
  deploymentId: string;
  workspaceId: string;
  mode: "static" | "node-build";
  framework: string;
  entryRelativePath: string;
  createdAt: string;
};

const getDeploymentMetaPath = (deploymentRoot: string): string => {
  return path.join(deploymentRoot, ".deployment-meta.json");
};

const normalizeWorkspacePath = (rawPath: string): string => {
  return rawPath.replace(/\\/g, "/").replace(/^\/+/, "");
};

type AiAction = "explain" | "fix" | "refactor" | "tests";

const aiActionPrompts: Record<AiAction, string> = {
  explain: "Explain this code in simple terms:",
  fix: "Find bugs and fix this code:",
  refactor: "Refactor this code for better performance and readability:",
  tests: "Write unit tests for this code:",
};

const parseGroqStreamChunk = (chunk: string): string[] => {
  return chunk.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
};

const streamGroqAiAction = async (params: {
  workspaceId: string;
  requestId: string;
  action: AiAction;
  code: string;
  language?: string;
  context?: string;
  userId: string;
}): Promise<void> => {
  const { workspaceId, requestId, action, code, language, context, userId } = params;
  const user = await usersCollection().findOne({ id: userId });
  const username = user?.username || "unknown";

  broadcastChatRoom(workspaceId, {
    type: "ai:stream-start",
    requestId,
    action,
    userId,
    username,
    createdAt: nowIso(),
  });

  try {
    const upstream = await fetch(GROQ_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: "You are an expert software engineer." },
          {
            role: "user",
            content: `${aiActionPrompts[action]}\n\n${code}\n\nLanguage: ${language || "unknown"}\nContext: ${context || "none"}`,
          },
        ],
        stream: false,
      }),
    });

    const rawResponse = await upstream.clone().text();
    console.log("[GROQ AI action raw response]", rawResponse);

    if (!upstream.ok) {
      let errorMessage = "AI request failed";
      try {
        const errorData = JSON.parse(rawResponse) as { error?: { message?: string } };
        errorMessage = errorData.error?.message || errorMessage;
      } catch {
        // Ignore parse failures and use the default error message.
      }

      broadcastChatRoom(workspaceId, {
        type: "ai:error",
        requestId,
        message: errorMessage,
      });
      return;
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    const content = data?.choices?.[0]?.message?.content?.trim() || data?.error?.message || "No response returned from Groq.";

    if (!data?.choices?.[0]?.message?.content?.trim()) {
      broadcastChatRoom(workspaceId, {
        type: "ai:error",
        requestId,
        message: content,
      });
      return;
    }

    broadcastChatRoomRaw(workspaceId, content);
  } catch (error) {
    logger.error("AI action stream failed", error);
    broadcastChatRoom(workspaceId, {
      type: "ai:error",
      requestId,
      message: error instanceof Error ? error.message : "AI action failed",
    });
  }
};

const shouldIgnoreWorkspacePath = (rawPath: string): boolean => {
  const normalized = `/${normalizeWorkspacePath(rawPath).toLowerCase()}`;
  return (
    normalized.includes("/node_modules/") ||
    normalized.includes("/.git/") ||
    normalized.includes("/.next/") ||
    normalized.includes("/.turbo/")
  );
};

const pathExists = async (target: string): Promise<boolean> => {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
};

const runCommand = async (
  command: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      shell: false,
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);

      if (timedOut) {
        reject(new Error(`${command} ${args.join(" ")} timed out after ${timeoutMs}ms`));
        return;
      }

      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
};

const detectBuildOutputSubpath = async (root: string): Promise<string | null> => {
  const candidates = ["dist", "build", "out"];
  for (const candidate of candidates) {
    if (await pathExists(path.join(root, candidate, "index.html"))) {
      return candidate;
    }
  }
  return null;
};

const deployNodeProject = async (projectRoot: string): Promise<{ outputSubpath: string; framework: string }> => {
  const packagePath = path.join(projectRoot, "package.json");
  if (!(await pathExists(packagePath))) {
    throw new Error("package.json not found");
  }

  const packageJsonRaw = await fs.readFile(packagePath, "utf8");
  const packageJson = JSON.parse(packageJsonRaw) as {
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const scripts = packageJson.scripts || {};
  if (!scripts.build) {
    throw new Error("No build script found in package.json");
  }

  const isNextProject =
    Boolean(packageJson.dependencies?.next) ||
    Boolean(packageJson.devDependencies?.next) ||
    (await pathExists(path.join(projectRoot, "next.config.js"))) ||
    (await pathExists(path.join(projectRoot, "next.config.mjs"))) ||
    (await pathExists(path.join(projectRoot, "next.config.ts")));

  const npmBin = process.platform === "win32" ? "npm.cmd" : "npm";
  const installResult = await runCommand(npmBin, ["install", "--no-audit", "--no-fund"], projectRoot, DEPLOY_BUILD_TIMEOUT_MS);
  if (installResult.exitCode !== 0) {
    throw new Error(`npm install failed: ${installResult.stderr || installResult.stdout}`);
  }

  const buildResult = await runCommand(npmBin, ["run", "build"], projectRoot, DEPLOY_BUILD_TIMEOUT_MS);
  if (buildResult.exitCode !== 0) {
    throw new Error(`npm run build failed: ${buildResult.stderr || buildResult.stdout}`);
  }

  let outputSubpath = await detectBuildOutputSubpath(projectRoot);
  if (!outputSubpath && isNextProject) {
    if (scripts.export) {
      const exportResult = await runCommand(npmBin, ["run", "export"], projectRoot, DEPLOY_BUILD_TIMEOUT_MS);
      if (exportResult.exitCode !== 0) {
        throw new Error(`npm run export failed: ${exportResult.stderr || exportResult.stdout}`);
      }
      outputSubpath = await detectBuildOutputSubpath(projectRoot);
    }

    if (!outputSubpath) {
      throw new Error("Next.js project build completed but no static output found. Configure static export (for example next.config output: 'export').");
    }
  }

  if (!outputSubpath) {
    throw new Error("Build completed but no static output folder found (dist/build/out)");
  }

  return {
    outputSubpath,
    framework: isNextProject ? "next" : "react",
  };
};

const detectNodeProjectRoot = (files: FileDoc[]): string | null => {
  const normalizedFilePaths = new Set(
    files
      .filter((row) => row.type === "file")
      .map((row) => normalizeWorkspacePath(row.path))
  );

  const packageCandidates = Array.from(normalizedFilePaths)
    .filter((filepath) => filepath.endsWith("package.json") && !shouldIgnoreWorkspacePath(filepath))
    .map((filepath) => {
      const idx = filepath.lastIndexOf("/");
      return idx === -1 ? "" : filepath.slice(0, idx);
    });

  if (!packageCandidates.length) {
    return null;
  }

  const scoreCandidate = (dir: string): number => {
    const prefix = dir ? `${dir}/` : "";
    let score = 0;
    if (normalizedFilePaths.has(`${prefix}next.config.js`) || normalizedFilePaths.has(`${prefix}next.config.mjs`) || normalizedFilePaths.has(`${prefix}next.config.ts`)) score += 10;
    if (normalizedFilePaths.has(`${prefix}vite.config.ts`) || normalizedFilePaths.has(`${prefix}vite.config.js`)) score += 8;
    if (normalizedFilePaths.has(`${prefix}src/main.tsx`) || normalizedFilePaths.has(`${prefix}src/main.jsx`)) score += 4;
    if (normalizedFilePaths.has(`${prefix}index.html`)) score += 2;
    if (dir === "") score += 1;
    return score;
  };

  const sorted = [...new Set(packageCandidates)].sort((a, b) => {
    const scoreDiff = scoreCandidate(b) - scoreCandidate(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.length - b.length;
  });

  return sorted[0] ?? null;
};

const detectPreferredTerminalSubpath = (files: FileDoc[]): string => {
  const projectRoot = detectNodeProjectRoot(files);
  if (projectRoot !== null) {
    return projectRoot;
  }

  const topLevelFolders = new Set<string>();
  const hasTopLevelFiles = files.some((row) => {
    if (row.type !== "file") return false;
    const normalized = normalizeWorkspacePath(row.path);
    return normalized.split("/").filter(Boolean).length <= 1;
  });

  for (const row of files) {
    const normalized = normalizeWorkspacePath(row.path);
    const firstSegment = normalized.split("/").filter(Boolean)[0];
    if (!firstSegment) continue;
    if (!shouldIgnoreWorkspacePath(normalized)) {
      topLevelFolders.add(firstSegment);
    }
  }

  if (!hasTopLevelFiles && topLevelFolders.size === 1) {
    return Array.from(topLevelFolders)[0];
  }

  return "";
};

const escapeHtml = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const ensureDeploymentIndex = async (root: string, workspaceName: string, files: FileDoc[]): Promise<void> => {
  const hasIndex = files.some((row) => row.type === "file" && row.path.toLowerCase() === "/index.html");
  if (hasIndex) {
    return;
  }

  const fileLinks = files
    .filter((row) => row.type === "file")
    .map((row) => {
      const relative = row.path.replace(/^\/+/, "").replace(/\\/g, "/");
      if (!relative) {
        return "";
      }
      return `<li><a href="./${encodeURI(relative)}">${escapeHtml(row.path)}</a></li>`;
    })
    .filter(Boolean)
    .join("\n");

  const fallbackHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(workspaceName)} deployment</title>
  <style>
    body { font-family: Inter, Segoe UI, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; }
    main { max-width: 840px; margin: 60px auto; padding: 24px; }
    h1 { margin-top: 0; font-size: 1.4rem; }
    p { color: #94a3b8; }
    ul { padding-left: 1.2rem; }
    a { color: #38bdf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <main>
    <h1>${escapeHtml(workspaceName)} is deployed</h1>
    <p>No <code>/index.html</code> file was found, so this file browser page was generated automatically.</p>
    <h2>Workspace files</h2>
    <ul>${fileLinks || "<li>No files found</li>"}</ul>
  </main>
</body>
</html>`;

  await fs.writeFile(path.join(root, "index.html"), fallbackHtml, "utf8");
};

const resolveDeploymentEntryPath = async (deploymentRoot: string): Promise<string> => {
  const metaPath = getDeploymentMetaPath(deploymentRoot);
  if (await pathExists(metaPath)) {
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(raw) as Partial<DeploymentMeta>;
      const entry = (meta.entryRelativePath || "index.html").replace(/^\/+/, "");
      if (await pathExists(path.join(deploymentRoot, entry))) {
        return entry;
      }
    } catch {
      // ignore invalid meta and fall through to heuristics
    }
  }

  const candidates = [
    "index.html",
    "dist/index.html",
    "build/index.html",
    "out/index.html",
    "frontend/dist/index.html",
    "frontend/build/index.html",
    "frontend/out/index.html",
  ];

  for (const candidate of candidates) {
    if (await pathExists(path.join(deploymentRoot, candidate))) {
      return candidate;
    }
  }

  return "index.html";
};

const serveDeploymentEntry = async (deploymentId: string, res: Response): Promise<void> => {
  const deploymentRoot = getWorkspaceDeploymentPath(deploymentId);

  if (!(await pathExists(deploymentRoot))) {
    res.status(404).json({ success: false, message: "Deployment not found" });
    return;
  }

  const entryPath = (await resolveDeploymentEntryPath(deploymentRoot)).replace(/\\/g, "/").replace(/^\/+/, "");
  const absoluteEntryPath = path.join(deploymentRoot, entryPath);

  if (!(await pathExists(absoluteEntryPath))) {
    res.status(404).json({ success: false, message: "Deployment entry not found" });
    return;
  }

  if (entryPath.toLowerCase() === "index.html") {
    res.sendFile(absoluteEntryPath);
    return;
  }

  res.redirect(302, `/deployments/${deploymentId}/${entryPath}`);
};

const createWorkspaceDeployment = async (
  workspaceId: string
): Promise<{ deploymentId: string; url: string; fileCount: number; mode: "static" | "node-build"; framework: string }> => {
  const workspace = await workspacesCollection().findOne({ id: workspaceId });
  if (!workspace) {
    throw new Error("Workspace not found");
  }

  const files = (await filesCollection().find({ workspace_id: workspaceId }).toArray()).filter(
    (row) => !shouldIgnoreWorkspacePath(row.path)
  );
  const deploymentId = randomUUID();
  const root = getWorkspaceDeploymentPath(deploymentId);

  await fs.mkdir(root, { recursive: true });

  const sorted = [...files].sort((a, b) => a.path.length - b.path.length);
  for (const item of sorted) {
    const relative = item.path.replace(/^\/+/, "");
    if (!relative) continue;

    const normalized = path.normalize(relative);
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
      continue;
    }

    const absolutePath = path.join(root, normalized);
    if (item.type === "folder") {
      await fs.mkdir(absolutePath, { recursive: true });
      continue;
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, item.content || "", "utf8");
  }

  let mode: "static" | "node-build" = "static";
  let framework = "plain";
  let outputSubpath: string | null = null;

  const projectRootSubpath = detectNodeProjectRoot(files);
  if (projectRootSubpath !== null) {
    const projectRoot = projectRootSubpath ? path.join(root, projectRootSubpath) : root;
    const nodeDeployment = await deployNodeProject(projectRoot);
    mode = "node-build";
    framework = nodeDeployment.framework;
    outputSubpath = projectRootSubpath
      ? `${projectRootSubpath}/${nodeDeployment.outputSubpath}`
      : nodeDeployment.outputSubpath;
  } else {
    await ensureDeploymentIndex(root, workspace.name, files);
  }

  const baseUrl = `${PUBLIC_BASE_URL}/deployments/${deploymentId}/`;
  const entryRelativePath = outputSubpath ? `${outputSubpath}/index.html` : "index.html";

  const deploymentMeta: DeploymentMeta = {
    deploymentId,
    workspaceId,
    mode,
    framework,
    entryRelativePath,
    createdAt: nowIso(),
  };
  await fs.writeFile(getDeploymentMetaPath(root), JSON.stringify(deploymentMeta, null, 2), "utf8");

  return {
    deploymentId,
    url: baseUrl,
    fileCount: files.filter((row) => row.type === "file").length,
    mode,
    framework,
  };
};

const materializeWorkspaceFiles = async (workspaceId: string): Promise<string> => {
  const root = getWorkspaceRuntimePath(workspaceId);
  const files = await filesCollection().find({ workspace_id: workspaceId }).toArray();

  // Do not remove the root directory while a terminal process may be using it.
  await fs.mkdir(root, { recursive: true });

  const sorted = [...files].sort((a, b) => a.path.length - b.path.length);

  for (const item of sorted) {
    const relative = item.path.replace(/^\/+/, "");
    if (!relative) continue;

    const normalized = path.normalize(relative);
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
      continue;
    }

    const absolutePath = path.join(root, normalized);

    if (item.type === "folder") {
      await fs.mkdir(absolutePath, { recursive: true });
      continue;
    }

    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, item.content || "", "utf8");
  }

  return root;
};

const syncWorkspaceRuntimeSafe = async (workspaceId: string): Promise<void> => {
  try {
    await materializeWorkspaceFiles(workspaceId);
  } catch (error) {
    logger.error(`Failed to sync runtime workspace for ${workspaceId}`, error);
  }
};

const getOrCreateCollabRoom = (roomName: string): CollabRoom => {
  const existing = collabRooms.get(roomName);
  if (existing) return existing;

  const created: CollabRoom = { doc: new Y.Doc(), clients: new Set<WebSocket>() };
  collabRooms.set(roomName, created);
  return created;
};

const broadcastBinary = (room: CollabRoom, sender: WebSocket, payload: Uint8Array): void => {
  for (const client of room.clients) {
    if (client !== sender && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};

const sendSocket = (socket: WebSocket, data: Record<string, unknown>): void => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
};

const broadcastChatRoom = (workspaceId: string, payload: Record<string, unknown>): void => {
  const room = chatRooms.get(workspaceId);
  if (!room) return;
  for (const client of room) {
    sendSocket(client.socket, payload);
  }
};

const broadcastChatRoomRaw = (workspaceId: string, content: string): void => {
  const room = chatRooms.get(workspaceId);
  if (!room) return;
  for (const client of room) {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(content);
    }
  }
};

const broadcastCursorRoom = (
  workspaceId: string,
  resourceId: string,
  payload: Record<string, unknown>
): void => {
  const room = chatRooms.get(workspaceId);
  if (!room) return;

  for (const client of room) {
    if (client.activeResourceId !== resourceId) {
      continue;
    }
    sendSocket(client.socket, payload);
  }
};

const parseToken = (token: string): AuthPayload | null => {
  const normalized = token.trim().replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "");
  if (!normalized) return null;
  try {
    return jwt.verify(normalized, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
};

const resolveWsAuth = async (workspaceId: string, token: string): Promise<AuthPayload | null> => {
  try {
    const parsed = parseToken(token);
    if (parsed) {
      return parsed;
    }

    if (!WS_DEV_AUTH_BYPASS) {
      return null;
    }

    const workspace = await workspacesCollection().findOne({ id: workspaceId });
    if (!workspace?.owner_id) {
      return null;
    }

    const owner = await usersCollection().findOne({ id: workspace.owner_id });
    if (!owner) {
      return null;
    }

    logger.info(`WS auth bypass active for workspace ${workspaceId}; using owner identity`);
    return { userId: owner.id, email: owner.email };
  } catch (error) {
    logger.error("Database error in resolveWsAuth", { workspaceId, error: error instanceof Error ? error.message : String(error) });
    return null; // Return null on database errors to prevent crashes
  }
};

const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Token required" });
    return;
  }

  const payload = parseToken(token);
  if (!payload) {
    res.status(401).json({ success: false, message: "Invalid token" });
    return;
  }

  req.user = payload;
  next();
};

const languageFromFilename = (name: string): string => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    py: "python",
    go: "go",
    rb: "ruby",
    rs: "rust",
    java: "java",
    php: "php",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    c: "c",
    cpp: "cpp",
  };
  return map[ext] || "plaintext";
};

const toPublicUser = (user: Pick<UserDoc, "id" | "email" | "username" | "created_at">) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  created_at: user.created_at,
});

const pathJoin = (parentPath: string, name: string): string => {
  if (!parentPath || parentPath === "/") {
    return `/${name}`;
  }
  return `${parentPath}/${name}`;
};

const buildFileTree = (rows: FileDoc[]) => {
  const byId = new Map<string, any>();
  const roots: any[] = [];

  for (const file of rows) {
    byId.set(file.id, {
      id: file.id,
      parentId: file.parent_id,
      workspaceId: file.workspace_id,
      name: file.name,
      type: file.type,
      path: file.path,
      content: file.content || "",
      language: file.language || languageFromFilename(file.name),
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      children: [],
    });
  }

  for (const file of rows) {
    const node = byId.get(file.id);
    if (file.parent_id && byId.has(file.parent_id)) {
      byId.get(file.parent_id).children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortTree = (nodes: any[]): void => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      sortTree(node.children);
    }
  };

  sortTree(roots);
  return roots;
};

const activityLog = async (
  workspaceId: string,
  userId: string,
  action: string,
  target: string,
  meta: Record<string, unknown> = {}
): Promise<void> => {
  await activityCollection().insertOne({
    id: randomUUID(),
    workspace_id: workspaceId,
    user_id: userId,
    action,
    target,
    metadata: meta,
    created_at: nowIso(),
  });
};

const getWorkspaceRole = async (workspaceId: string, userId: string): Promise<Role | null> => {
  try {
    const member = await membersCollection().findOne({ workspace_id: workspaceId, user_id: userId });
    return member?.role || null;
  } catch (error) {
    logger.error("Database error in getWorkspaceRole", { workspaceId, userId, error: error instanceof Error ? error.message : String(error) });
    return null; // Return null on database errors to prevent crashes
  }
};

const requireWorkspaceRole = (minRole: Role) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const workspaceId = req.params.id || req.params.workspaceId;
    if (!workspaceId || !req.user) {
      res.status(400).json({ success: false, message: "Workspace context missing" });
      return;
    }

    const role = await getWorkspaceRole(workspaceId, req.user.userId);
    if (!role || roleRank[role] < roleRank[minRole]) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    next();
  };
};

const ensureIndexes = async (): Promise<void> => {
  await usersCollection().createIndex({ email: 1 }, { unique: true });
  await usersCollection().createIndex({ username: 1 }, { unique: true });

  await workspacesCollection().createIndex({ owner_id: 1 });
  await workspacesCollection().createIndex({ updated_at: -1 });

  await membersCollection().createIndex({ workspace_id: 1, user_id: 1 }, { unique: true });
  await membersCollection().createIndex({ user_id: 1 });

  await invitesCollection().createIndex({ token: 1 }, { unique: true });
  await invitesCollection().createIndex({ workspace_id: 1, email: 1 });

  await filesCollection().createIndex({ workspace_id: 1, path: 1 }, { unique: true });
  await filesCollection().createIndex({ workspace_id: 1, parent_id: 1 });

  await snapshotsCollection().createIndex({ workspace_id: 1, created_at: -1 });
  await snapshotFilesCollection().createIndex({ snapshot_id: 1, path: 1 }, { unique: true });

  await activityCollection().createIndex({ workspace_id: 1, created_at: -1 });
  await chatCollection().createIndex({ workspace_id: 1, created_at: -1 });

  await shareLinksCollection().createIndex({ token: 1 }, { unique: true });
  await shareLinksCollection().createIndex({ workspace_id: 1, created_by: 1 }, { unique: true });
};

const createDefaultAdmin = async (): Promise<void> => {
  const existing = await usersCollection().findOne({ email: "admin@synergy.com" });
  if (existing) return;

  const hash = await bcrypt.hash("admin123", 10);
  const userId = randomUUID();
  await usersCollection().insertOne({
    id: userId,
    email: "admin@synergy.com",
    username: "admin",
    password_hash: hash,
    created_at: nowIso(),
    updated_at: nowIso(),
  });

  logger.info(`Created default admin user ${userId}`);
};

const templates = [
  {
    id: "react",
    name: "React + TypeScript",
    files: [
      { path: "/src", name: "src", type: "folder" as const },
      { path: "/src/main.tsx", name: "main.tsx", type: "file" as const, content: "import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nReactDOM.createRoot(document.getElementById('root')!).render(<App />);" },
      { path: "/src/App.tsx", name: "App.tsx", type: "file" as const, content: "export default function App() {\n  return <h1>Hello React Workspace</h1>;\n}" },
      { path: "/package.json", name: "package.json", type: "file" as const, content: "{\n  \"name\": \"react-project\",\n  \"private\": true\n}" },
    ],
  },
  {
    id: "node",
    name: "Node.js API",
    files: [
      { path: "/src", name: "src", type: "folder" as const },
      { path: "/src/index.js", name: "index.js", type: "file" as const, content: "const express = require('express');\nconst app = express();\napp.get('/health', (_, res) => res.json({ ok: true }));\napp.listen(3000);" },
      { path: "/package.json", name: "package.json", type: "file" as const, content: "{\n  \"name\": \"node-api\",\n  \"main\": \"src/index.js\"\n}" },
    ],
  },
  {
    id: "python",
    name: "Python Starter",
    files: [
      { path: "/src", name: "src", type: "folder" as const },
      { path: "/src/main.py", name: "main.py", type: "file" as const, content: "def main():\n    print('Hello Python workspace')\n\nif __name__ == '__main__':\n    main()" },
      { path: "/requirements.txt", name: "requirements.txt", type: "file" as const, content: "" },
    ],
  },
];

app.use(helmet());
app.use(
  cors({
    origin: [
      FRONTEND_ORIGIN, 
      "http://localhost:3000", 
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      /^http:\/\/192\.168\.\d+\.\d+:5173$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "5mb" }));
app.get("/deployments/:deploymentId", async (req: Request, res: Response) => {
  await serveDeploymentEntry(req.params.deploymentId, res);
});

app.get("/deployments/:deploymentId/", async (req: Request, res: Response) => {
  await serveDeploymentEntry(req.params.deploymentId, res);
});

app.use("/deployments", express.static(DEPLOYMENTS_ROOT, { index: ["index.html"] }));

app.get("/", (_req, res) => {
  res.json({ message: "backend api is running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "OK", time: nowIso(), db: "mongodb" });
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  const { email, username, password } = req.body as { email?: string; username?: string; password?: string };
  if (!email || !username || !password) {
    res.status(400).json({ success: false, message: "Email, username and password required" });
    return;
  }

  const existing = await usersCollection().findOne({ $or: [{ email }, { username }] });
  if (existing) {
    res.status(409).json({ success: false, message: "User already exists" });
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const user: UserDoc = {
    id: randomUUID(),
    email,
    username,
    password_hash: hash,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  await usersCollection().insertOne(user);
  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, data: { user: toPublicUser(user), token } });
});

app.post("/api/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) {
    res.status(400).json({ success: false, message: "Email and password required" });
    return;
  }

  const user = await usersCollection().findOne({ email });
  if (!user) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  if (!user.password_hash) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
  res.json({ success: true, data: { user: toPublicUser(user), token } });
});

app.get("/api/auth/verify", authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await usersCollection().findOne({ id: req.user!.userId });
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json({ success: true, data: { user: toPublicUser(user) } });
});

app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
  const { email, newPassword } = req.body as { email?: string; newPassword?: string };
  if (!email || !newPassword || newPassword.length < 6) {
    res.status(400).json({ success: false, message: "Valid email and password required" });
    return;
  }

  const hash = await bcrypt.hash(newPassword, 10);
  const update = await usersCollection().updateOne({ email }, { $set: { password_hash: hash, updated_at: nowIso() } });
  if (!update.matchedCount) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json({ success: true, message: "Password updated" });
});

app.get("/api/users/profile", authenticateToken, async (req: AuthRequest, res: Response) => {
  const user = await usersCollection().findOne({ id: req.user!.userId });
  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json({ success: true, data: toPublicUser(user) });
});

// OAuth utility functions (add before app routes)
const verifyGoogleToken = async (token: string): Promise<{ id: string; email: string; name: string; picture: string }> => {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=" + token);
  if (!response.ok) {
    throw new Error("Invalid Google token");
  }
  const data = (await response.json()) as {
    sub?: string;
    email?: string;
    name?: string;
    picture?: string;
  };
  if (!data.sub || !data.email) {
    throw new Error("Invalid token payload");
  }
  return {
    id: data.sub,
    email: data.email,
    name: data.name || "",
    picture: data.picture || "",
  };
};

const getGitHubAccessToken = async (
  code: string,
  clientId: string,
  clientSecret: string
): Promise<string> => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: `${FRONTEND_ORIGIN}/auth/github/callback`
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for access token");
  }

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error || "No access token received");
  }

  return data.access_token;
};

const getGitHubUser = async (accessToken: string): Promise<{
  id: string;
  email: string;
  login: string;
  avatar_url: string;
}> => {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub user");
  }

  const data = (await response.json()) as {
    id?: number;
    email?: string;
    login?: string;
    avatar_url?: string;
  };

  if (!data.id || !data.login) {
    throw new Error("Invalid GitHub user data");
  }

  return {
    id: String(data.id),
    email: data.email || `${data.login}@github.com`,
    login: data.login,
    avatar_url: data.avatar_url || "",
  };
};

// OAuth Routes (replace incomplete routes)
app.post("/api/auth/google", async (req: Request, res: Response) => {
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ success: false, message: "Token required" });
    return;
  }

  try {
    if (!GOOGLE_CLIENT_ID) {
      res.status(500).json({ success: false, message: "Google OAuth not configured" });
      return;
    }

    const oauthUser = await verifyGoogleToken(token);
    const existingUser = await usersCollection().findOne({ email: oauthUser.email });

    let finalUser: UserDoc;

    if (!existingUser) {
      // Create new user from Google OAuth
      const safeName = oauthUser.name ? oauthUser.name.replace(/\s+/g, "").toLowerCase() : oauthUser.email.split("@")[0];
      const uniqueUsername = `${safeName}_${randomUUID().substring(0, 5)}`;
      
      const newUser: UserDoc = {
        id: randomUUID(),
        email: oauthUser.email,
        username: uniqueUsername,
        oauth_provider: "google",
        oauth_id: oauthUser.id,
        avatar_url: oauthUser.picture,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      await usersCollection().insertOne(newUser);
      finalUser = newUser;
    } else {
      if (!existingUser.oauth_id || !existingUser.avatar_url) {
        // Link Google OAuth to existing user or update avatar
        await usersCollection().updateOne(
          { id: existingUser.id },
          {
            $set: {
              ...(!existingUser.oauth_id ? { oauth_provider: "google", oauth_id: oauthUser.id } : {}),
              ...(!existingUser.avatar_url ? { avatar_url: oauthUser.picture } : {}),
              updated_at: nowIso(),
            },
          }
        );
      }
      finalUser = existingUser;
    }

    const jwtToken = jwt.sign(
      { userId: finalUser.id, email: finalUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        user: toPublicUser(finalUser),
        token: jwtToken,
      },
    });
  } catch (error) {
    logger.error("Google auth error:", error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "Google authentication failed",
    });
  }
});

app.post("/api/auth/github", async (req: Request, res: Response) => {
  const { code } = req.body as { code?: string };
  if (!code) {
    res.status(400).json({ success: false, message: "Code required" });
    return;
  }

  try {
    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      res.status(500).json({ success: false, message: "GitHub OAuth not configured" });
      return;
    }

    const accessToken = await getGitHubAccessToken(code, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET);
    const oauthUser = await getGitHubUser(accessToken);

    // Check if user exists by email or oauth_id
    const existingUser = await usersCollection().findOne({
      $or: [{ email: oauthUser.email }, { oauth_id: oauthUser.id }],
    });

    let finalUser: UserDoc;

    if (!existingUser) {
      // Create new user from GitHub OAuth
      const newUser: UserDoc = {
        id: randomUUID(),
        email: oauthUser.email,
        username: oauthUser.login || oauthUser.email.split("@")[0],
        oauth_provider: "github",
        oauth_id: oauthUser.id,
        avatar_url: oauthUser.avatar_url,
        created_at: nowIso(),
        updated_at: nowIso(),
      };
      await usersCollection().insertOne(newUser);
      finalUser = newUser;
    } else {
      if (!existingUser.oauth_id) {
        // Link GitHub OAuth to existing user
        await usersCollection().updateOne(
          { id: existingUser.id },
          {
            $set: {
              oauth_provider: "github",
              oauth_id: oauthUser.id,
              avatar_url: oauthUser.avatar_url,
              updated_at: nowIso(),
            },
          }
        );
      }
      finalUser = existingUser;
    }

    const jwtToken = jwt.sign(
      { userId: finalUser.id, email: finalUser.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      data: {
        user: toPublicUser(finalUser),
        token: jwtToken,
      },
    });
  } catch (error) {
    logger.error("GitHub auth error:", error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : "GitHub authentication failed",
    });
  }
});

app.get("/api/templates", authenticateToken, (_req: AuthRequest, res: Response) => {
  res.json({ success: true, data: templates.map((t) => ({ id: t.id, name: t.name })) });
});

app.post("/api/workspaces", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { name, templateId } = req.body as { name?: string; templateId?: string };
  if (!name) {
    res.status(400).json({ success: false, message: "Workspace name required" });
    return;
  }

  const workspace: WorkspaceDoc = {
    id: randomUUID(),
    name,
    owner_id: req.user!.userId,
    template_id: templateId || null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  await workspacesCollection().insertOne(workspace);
  await membersCollection().updateOne(
    { workspace_id: workspace.id, user_id: req.user!.userId },
    { $set: { role: "owner", created_at: nowIso() } },
    { upsert: true }
  );

  if (templateId) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const pathToId = new Map<string, string>();
      for (const item of template.files) {
        const segments = item.path.split("/").filter(Boolean);
        const parentPath = segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "";
        const parentId = parentPath ? pathToId.get(parentPath) || null : null;

        const fileDoc: FileDoc = {
          id: randomUUID(),
          workspace_id: workspace.id,
          parent_id: parentId,
          name: item.name,
          type: item.type,
          path: item.path,
          content: item.type === "file" ? item.content || "" : null,
          language: item.type === "file" ? languageFromFilename(item.name) : null,
          created_by: req.user!.userId,
          updated_by: req.user!.userId,
          created_at: nowIso(),
          updated_at: nowIso(),
        };

        await filesCollection().insertOne(fileDoc);
        pathToId.set(item.path, fileDoc.id);
      }
    }
  }

  await activityLog(workspace.id, req.user!.userId, "workspace.created", workspace.name, {
    templateId: templateId || null,
  });

  res.json({ success: true, data: { ...workspace, role: "owner" } });
});

app.get("/api/workspaces", authenticateToken, async (req: AuthRequest, res: Response) => {
  const memberships = await membersCollection().find({ user_id: req.user!.userId }).toArray();
  const workspaceIds = memberships.map((m) => m.workspace_id);

  if (!workspaceIds.length) {
    res.json({ success: true, data: [] });
    return;
  }

  const roleByWorkspace = new Map<string, Role>();
  for (const membership of memberships) {
    roleByWorkspace.set(membership.workspace_id, membership.role);
  }

  const workspaces = await workspacesCollection()
    .find({ id: { $in: workspaceIds } })
    .sort({ updated_at: -1 } as Sort)
    .toArray();

  const data = workspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    owner_id: workspace.owner_id,
    created_at: workspace.created_at,
    updated_at: workspace.updated_at,
    role: roleByWorkspace.get(workspace.id) || "viewer",
  }));

  res.json({ success: true, data });
});

app.get("/api/workspaces/:id", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const workspace = await workspacesCollection().findOne({ id: workspaceId });
  if (!workspace) {
    res.status(404).json({ success: false, message: "Workspace not found" });
    return;
  }

  const [files, members, activity] = await Promise.all([
    filesCollection().find({ workspace_id: workspaceId }).toArray(),
    membersCollection().find({ workspace_id: workspaceId }).toArray(),
    activityCollection().find({ workspace_id: workspaceId }).sort({ created_at: -1 } as Sort).limit(100).toArray(),
  ]);

  const memberUserIds = members.map((m) => m.user_id);
  const memberUsers = await usersCollection().find({ id: { $in: memberUserIds } }).toArray();
  const userById = new Map<string, UserDoc>(memberUsers.map((u) => [u.id, u]));

  const activityUserIds = activity.map((a) => a.user_id);
  const activityUsers = await usersCollection().find({ id: { $in: activityUserIds } }).toArray();
  for (const user of activityUsers) {
    userById.set(user.id, user);
  }

  res.json({
    success: true,
    data: {
      id: workspace.id,
      name: workspace.name,
      owner_id: workspace.owner_id,
      created_at: workspace.created_at,
      updated_at: workspace.updated_at,
      files: buildFileTree(files),
      members: members.map((m) => ({
        user_id: m.user_id,
        username: userById.get(m.user_id)?.username || "unknown",
        email: userById.get(m.user_id)?.email || "unknown",
        role: m.role,
      })),
      activity: activity.map((a) => ({
        id: a.id,
        action: a.action,
        target: a.target,
        username: userById.get(a.user_id)?.username || "unknown",
        created_at: a.created_at,
        metadata: a.metadata,
      })),
    },
  });
});

app.delete("/api/workspaces/:id", authenticateToken, requireWorkspaceRole("owner"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;

  await Promise.all([
    workspacesCollection().deleteOne({ id: workspaceId }),
    membersCollection().deleteMany({ workspace_id: workspaceId }),
    invitesCollection().deleteMany({ workspace_id: workspaceId }),
    filesCollection().deleteMany({ workspace_id: workspaceId }),
    snapshotsCollection().deleteMany({ workspace_id: workspaceId }),
    activityCollection().deleteMany({ workspace_id: workspaceId }),
    chatCollection().deleteMany({ workspace_id: workspaceId }),
    shareLinksCollection().deleteMany({ workspace_id: workspaceId }),
  ]);

  res.json({ success: true, message: "Workspace deleted" });
});

app.get("/api/workspaces/:id/share", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const token = randomUUID();

  await shareLinksCollection().updateOne(
    { workspace_id: workspaceId, created_by: req.user!.userId },
    {
      $set: {
        token,
        workspace_id: workspaceId,
        created_by: req.user!.userId,
        created_at: nowIso(),
      },
    },
    { upsert: true }
  );

  const shareUrl = `${FRONTEND_ORIGIN}/share/${workspaceId}/${token}`;
  res.json({ success: true, data: { token, shareUrl } });
});

app.get("/api/share/:token", async (req: Request, res: Response) => {
  const token = req.params.token;
  const share = await shareLinksCollection().findOne({ token });
  if (!share) {
    res.status(404).json({ success: false, message: "Invalid or expired share link" });
    return;
  }

  const workspace = await workspacesCollection().findOne({ id: share.workspace_id });
  if (!workspace) {
    res.status(404).json({ success: false, message: "Workspace not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      workspace: {
        id: workspace.id,
        name: workspace.name,
        owner_id: workspace.owner_id,
        created_at: workspace.created_at,
      },
    },
  });
});

app.post("/api/workspaces/:id/invite", authenticateToken, requireWorkspaceRole("owner"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const { email, role } = req.body as { email?: string; role?: "editor" | "viewer" };

  if (!email || !role || !["editor", "viewer"].includes(role)) {
    res.status(400).json({ success: false, message: "Email and valid role required" });
    return;
  }

  const user = await usersCollection().findOne({ email });
  if (user) {
    await membersCollection().updateOne(
      { workspace_id: workspaceId, user_id: user.id },
      { $set: { role, created_at: nowIso() } },
      { upsert: true }
    );

    await activityLog(workspaceId, req.user!.userId, "member.invited", email, { role, accepted: true });
    res.json({ success: true, data: { accepted: true } });
    return;
  }

  const inviteToken = randomUUID();
  await invitesCollection().insertOne({
    id: randomUUID(),
    workspace_id: workspaceId,
    email,
    role,
    token: inviteToken,
    status: "pending",
    invited_by: req.user!.userId,
    created_at: nowIso(),
  });

  await activityLog(workspaceId, req.user!.userId, "member.invited", email, { role, accepted: false });
  res.json({ success: true, data: { accepted: false, inviteToken } });
});

app.get("/api/workspaces/:id/members", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const members = await membersCollection().find({ workspace_id: workspaceId }).sort({ created_at: 1 } as Sort).toArray();
  const users = await usersCollection().find({ id: { $in: members.map((m) => m.user_id) } }).toArray();
  const userById = new Map(users.map((u) => [u.id, u]));

  res.json({
    success: true,
    data: members.map((member) => ({
      user_id: member.user_id,
      username: userById.get(member.user_id)?.username || "unknown",
      email: userById.get(member.user_id)?.email || "unknown",
      role: member.role,
    })),
  });
});

app.get("/api/workspaces/:id/files", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const files = await filesCollection().find({ workspace_id: workspaceId }).toArray();
  res.json({ success: true, data: buildFileTree(files) });
});

app.post("/api/workspaces/:id/files", authenticateToken, requireWorkspaceRole("editor"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const { parentId, name, type, content } = req.body as {
    parentId?: string | null;
    name?: string;
    type?: "file" | "folder";
    content?: string;
  };

  if (!name || !type || !["file", "folder"].includes(type)) {
    res.status(400).json({ success: false, message: "name and type are required" });
    return;
  }

  let parentPath = "";
  if (parentId) {
    const parent = await filesCollection().findOne({ id: parentId, workspace_id: workspaceId });
    if (!parent || parent.type !== "folder") {
      res.status(400).json({ success: false, message: "Invalid parent folder" });
      return;
    }
    parentPath = parent.path;
  }

  const path = pathJoin(parentPath, name);
  const existingPath = await filesCollection().findOne({ workspace_id: workspaceId, path });
  if (existingPath) {
    res.status(409).json({ success: false, message: "A file or folder with this path already exists" });
    return;
  }

  const file: FileDoc = {
    id: randomUUID(),
    workspace_id: workspaceId,
    parent_id: parentId || null,
    name,
    type,
    path,
    content: type === "file" ? content || "" : null,
    language: type === "file" ? languageFromFilename(name) : null,
    created_by: req.user!.userId,
    updated_by: req.user!.userId,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  await filesCollection().insertOne(file);
  await workspacesCollection().updateOne({ id: workspaceId }, { $set: { updated_at: nowIso() } });
  await activityLog(workspaceId, req.user!.userId, "file.created", file.path, { type });
  await syncWorkspaceRuntimeSafe(workspaceId);

  res.json({ success: true, data: file });
});

app.patch("/api/files/:fileId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const fileId = req.params.fileId;
  const current = await filesCollection().findOne({ id: fileId });
  if (!current) {
    res.status(404).json({ success: false, message: "File not found" });
    return;
  }

  const role = await getWorkspaceRole(current.workspace_id, req.user!.userId);
  if (!role || roleRank[role] < roleRank.editor) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  const { name, content, parentId } = req.body as {
    name?: string;
    content?: string;
    parentId?: string | null;
  };

  let newName = current.name;
  let newParentId = current.parent_id;
  let newPath = current.path;

  if (typeof name === "string" && name.trim()) {
    newName = name.trim();
  }

  if (parentId !== undefined) {
    newParentId = parentId;
  }

  if (newName !== current.name || newParentId !== current.parent_id) {
    let parentPath = "";
    if (newParentId) {
      const parent = await filesCollection().findOne({ id: newParentId, workspace_id: current.workspace_id });
      if (!parent || parent.type !== "folder") {
        res.status(400).json({ success: false, message: "Invalid parent folder" });
        return;
      }
      parentPath = parent.path;
    }

    newPath = pathJoin(parentPath, newName);

    const conflict = await filesCollection().findOne({
      workspace_id: current.workspace_id,
      path: newPath,
      id: { $ne: fileId },
    });

    if (conflict) {
      res.status(409).json({ success: false, message: "A file or folder with this path already exists" });
      return;
    }
  }

  const updatePayload: Partial<FileDoc> = {
    name: newName,
    parent_id: newParentId,
    path: newPath,
    updated_by: req.user!.userId,
    updated_at: nowIso(),
  };

  if (typeof content === "string") {
    updatePayload.content = content;
  }

  if (current.type === "file" && newName !== current.name) {
    updatePayload.language = languageFromFilename(newName);
  }

  await filesCollection().updateOne({ id: fileId }, { $set: updatePayload });

  // Keep descendant paths consistent when a folder is moved or renamed.
  if (current.type === "folder" && newPath !== current.path) {
    const descendants = await filesCollection().find({
      workspace_id: current.workspace_id,
      path: { $regex: `^${current.path.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}/` },
    }).toArray();

    for (const child of descendants) {
      const replacedPath = child.path.replace(current.path, newPath);
      await filesCollection().updateOne(
        { id: child.id },
        { $set: { path: replacedPath, updated_at: nowIso(), updated_by: req.user!.userId } }
      );
    }
  }

  const updated = await filesCollection().findOne({ id: fileId });
  await workspacesCollection().updateOne({ id: current.workspace_id }, { $set: { updated_at: nowIso() } });
  await activityLog(current.workspace_id, req.user!.userId, "file.updated", newPath, {
    renamed: newName !== current.name,
    moved: newParentId !== current.parent_id,
    contentChanged: typeof content === "string",
  });
  await syncWorkspaceRuntimeSafe(current.workspace_id);

  res.json({ success: true, data: updated });
});

app.delete("/api/files/:fileId", authenticateToken, async (req: AuthRequest, res: Response) => {
  const fileId = req.params.fileId;
  const current = await filesCollection().findOne({ id: fileId });

  if (!current) {
    res.status(404).json({ success: false, message: "File not found" });
    return;
  }

  const role = await getWorkspaceRole(current.workspace_id, req.user!.userId);
  if (!role || roleRank[role] < roleRank.editor) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  await filesCollection().deleteMany({
    workspace_id: current.workspace_id,
    $or: [{ id: fileId }, { path: { $regex: `^${current.path.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}/` } }],
  });

  await workspacesCollection().updateOne({ id: current.workspace_id }, { $set: { updated_at: nowIso() } });
  await activityLog(current.workspace_id, req.user!.userId, "file.deleted", current.path);
  await syncWorkspaceRuntimeSafe(current.workspace_id);

  res.json({ success: true, message: "File deleted" });
});

app.post("/api/workspaces/:id/deploy", authenticateToken, requireWorkspaceRole("editor"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;

  try {
    const deployment = await createWorkspaceDeployment(workspaceId);
    await activityLog(workspaceId, req.user!.userId, "workspace.deployed", deployment.url, {
      deploymentId: deployment.deploymentId,
      fileCount: deployment.fileCount,
    });

    res.json({
      success: true,
      data: {
        deploymentId: deployment.deploymentId,
        url: deployment.url,
        fileCount: deployment.fileCount,
        mode: deployment.mode,
        framework: deployment.framework,
      },
    });
  } catch (error) {
    logger.error("Workspace deployment failed", {
      workspaceId,
      userId: req.user!.userId,
      error,
    });
    res.status(500).json({ success: false, message: "Deployment failed" });
  }
});

app.post("/api/workspaces/:id/snapshots", authenticateToken, requireWorkspaceRole("editor"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const { message } = req.body as { message?: string };
  const snapshotMessage = message || `Snapshot ${nowIso()}`;

  const snapshot: SnapshotDoc = {
    id: randomUUID(),
    workspace_id: workspaceId,
    message: snapshotMessage,
    created_by: req.user!.userId,
    created_at: nowIso(),
  };

  const files = await filesCollection().find({ workspace_id: workspaceId }).toArray();

  await snapshotsCollection().insertOne(snapshot);
  if (files.length) {
    await snapshotFilesCollection().insertMany(
      files.map((file) => ({
        snapshot_id: snapshot.id,
        file_id: file.id,
        path: file.path,
        type: file.type,
        name: file.name,
        content: file.content,
        language: file.language,
      }))
    );
  }

  await activityLog(workspaceId, req.user!.userId, "snapshot.created", snapshotMessage, {
    snapshotId: snapshot.id,
    fileCount: files.length,
  });

  res.json({ success: true, data: { id: snapshot.id, message: snapshot.message, created_at: snapshot.created_at } });
});

app.get("/api/workspaces/:id/snapshots", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const snapshots = await snapshotsCollection().find({ workspace_id: workspaceId }).sort({ created_at: -1 } as Sort).toArray();

  const users = await usersCollection().find({ id: { $in: snapshots.map((s) => s.created_by) } }).toArray();
  const userById = new Map(users.map((u) => [u.id, u.username]));

  res.json({
    success: true,
    data: snapshots.map((snapshot) => ({
      id: snapshot.id,
      message: snapshot.message,
      created_at: snapshot.created_at,
      username: userById.get(snapshot.created_by) || "unknown",
    })),
  });
});

app.post("/api/workspaces/:id/snapshots/:snapshotId/restore", authenticateToken, requireWorkspaceRole("editor"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const snapshotId = req.params.snapshotId;

  const snapshotFiles = await snapshotFilesCollection().find({ snapshot_id: snapshotId }).toArray();
  if (!snapshotFiles.length) {
    res.status(404).json({ success: false, message: "Snapshot not found or empty" });
    return;
  }

  await filesCollection().deleteMany({ workspace_id: workspaceId });

  const sorted = snapshotFiles.sort((a, b) => a.path.length - b.path.length);
  const pathToId = new Map<string, string>();

  for (const row of sorted) {
    const segments = row.path.split("/").filter(Boolean);
    const parentPath = segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "";
    const parentId = parentPath ? pathToId.get(parentPath) || null : null;

    const restored: FileDoc = {
      id: randomUUID(),
      workspace_id: workspaceId,
      parent_id: parentId,
      name: row.name,
      type: row.type,
      path: row.path,
      content: row.content,
      language: row.language,
      created_by: req.user!.userId,
      updated_by: req.user!.userId,
      created_at: nowIso(),
      updated_at: nowIso(),
    };

    await filesCollection().insertOne(restored);
    pathToId.set(row.path, restored.id);
  }

  await workspacesCollection().updateOne({ id: workspaceId }, { $set: { updated_at: nowIso() } });
  await activityLog(workspaceId, req.user!.userId, "snapshot.restored", snapshotId);
  await syncWorkspaceRuntimeSafe(workspaceId);

  res.json({ success: true, message: "Snapshot restored" });
});

app.get("/api/workspaces/:id/activity", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;

  const rows = await activityCollection().find({ workspace_id: workspaceId }).sort({ created_at: -1 } as Sort).limit(300).toArray();
  const users = await usersCollection().find({ id: { $in: rows.map((r) => r.user_id) } }).toArray();
  const userById = new Map(users.map((u) => [u.id, u.username]));

  res.json({
    success: true,
    data: rows.map((row) => ({
      id: row.id,
      action: row.action,
      target: row.target,
      metadata: row.metadata,
      created_at: row.created_at,
      username: userById.get(row.user_id) || "unknown",
    })),
  });
});

app.get("/api/workspaces/:id/chat", authenticateToken, requireWorkspaceRole("viewer"), async (req: AuthRequest, res: Response) => {
  const workspaceId = req.params.id;
  const limit = Math.min(Number(req.query.limit || 100), 500);

  const rows = await chatCollection().find({ workspace_id: workspaceId }).sort({ created_at: -1 } as Sort).limit(limit).toArray();
  const users = await usersCollection().find({ id: { $in: rows.map((r) => r.user_id) } }).toArray();
  const userById = new Map(users.map((u) => [u.id, u.username]));

  const data = rows
    .reverse()
    .map((row) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      username: userById.get(row.user_id) || "unknown",
      user_id: row.user_id,
    }));

  res.json({ success: true, data });
});

app.post("/api/ai/assist", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { taskType, code, language, context } = req.body as {
    taskType?: "explain" | "fix" | "refactor" | "tests" | "chat";
    code?: string;
    language?: string;
    context?: string;
  };

  if (!taskType || !code) {
    res.status(400).json({ success: false, message: "taskType and code are required" });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ success: false, message: "GROQ_API_KEY is not configured" });
    return;
  }

  const instructionsByTask: Record<string, string> = {
    explain: "Explain the code clearly and concisely with key points.",
    fix: "Find likely bugs and return a fixed version plus brief rationale.",
    refactor: "Refactor for readability and maintainability while preserving behavior.",
    tests: "Generate meaningful tests for this code, focusing on edge cases.",
    chat: "Respond as a helpful general chatbot. Be conversational, practical, and concise.",
  };

  const prompt = `${instructionsByTask[taskType]}\n\nLanguage: ${language || "unknown"}\nContext: ${context || "none"}\n\nCode:\n${code}`;

  const upstream = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a senior software engineer assistant." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    }),
  });

  const json = (await upstream.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!upstream.ok) {
    res.status(upstream.status).json({ success: false, message: json?.error?.message || "AI request failed" });
    return;
  }

  const content = json?.choices?.[0]?.message?.content || "";
  res.json({ success: true, data: { result: content } });
});

app.post("/api/ai/chat", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { message, workspaceId } = req.body as {
    message?: string;
    workspaceId?: string;
  };

  if (!message?.trim()) {
    res.status(400).json({ success: false, message: "message is required" });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ success: false, message: "GROQ_API_KEY is not configured" });
    return;
  }

  if (workspaceId) {
    const role = await getWorkspaceRole(workspaceId, req.user!.userId);
    if (!role || roleRank[role] < roleRank.viewer) {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }
  }

  const upstream = await fetch(GROQ_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Synergy AI, a collaborative coding assistant inside an IDE. Help with coding, debugging, and commands. Keep answers concise and practical.",
        },
        {
          role: "user",
          content: workspaceId ? `Workspace: ${workspaceId}\nUser: ${message.trim()}` : message.trim(),
        },
      ],
      temperature: 0.2,
    }),
  });

  const json = (await upstream.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!upstream.ok) {
    res.status(upstream.status).json({ success: false, message: json?.error?.message || "AI request failed" });
    return;
  }

  const content = json?.choices?.[0]?.message?.content || "";
  res.json({ success: true, data: { result: content } });
});

app.post("/api/ai/action", authenticateToken, async (req: AuthRequest, res: Response) => {
  const { workspaceId, requestId, action, code, language, context } = req.body as {
    workspaceId?: string;
    requestId?: string;
    action?: AiAction;
    code?: string;
    language?: string;
    context?: string;
  };

  if (!workspaceId || !action || !code?.trim()) {
    res.status(400).json({ success: false, message: "workspaceId, action, and code are required" });
    return;
  }

  if (!requestId) {
    res.status(400).json({ success: false, message: "requestId is required" });
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    res.status(500).json({ success: false, message: "GROQ_API_KEY is not configured" });
    return;
  }

  const role = await getWorkspaceRole(workspaceId, req.user!.userId);
  if (!role || roleRank[role] < roleRank.viewer) {
    res.status(403).json({ success: false, message: "Access denied" });
    return;
  }

  res.status(202).json({ success: true, data: { requestId } });

  void streamGroqAiAction({
    workspaceId,
    requestId,
    action,
    code: code.trim(),
    language,
    context,
    userId: req.user!.userId,
  });
});

app.use("*", (_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

const createRealtimeServers = (): void => {
  const yjsWss = new WebSocketServer({ noServer: true });
  const chatWss = new WebSocketServer({ noServer: true });
  const terminalWss = new WebSocketServer({ noServer: true });

  yjsWss.on("connection", (socket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const roomName = decodeURIComponent(url.pathname.replace(/^\/collab\/?/, "")) || "default";
    const room = getOrCreateCollabRoom(roomName);
    room.clients.add(socket);

    const initialEncoder = encoding.createEncoder();
    encoding.writeVarUint(initialEncoder, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(initialEncoder, room.doc);
    socket.send(encoding.toUint8Array(initialEncoder));

    socket.on("message", (raw) => {
      try {
        const payload = new Uint8Array(raw as Buffer);
        const decoder = decoding.createDecoder(payload);
        const messageType = decoding.readVarUint(decoder);

        if (messageType === MESSAGE_SYNC) {
          const replyEncoder = encoding.createEncoder();
          encoding.writeVarUint(replyEncoder, MESSAGE_SYNC);
          syncProtocol.readSyncMessage(decoder, replyEncoder, room.doc, null);
          const reply = encoding.toUint8Array(replyEncoder);
          if (reply.length > 1) {
            socket.send(reply);
          }

          const subtypeDecoder = decoding.createDecoder(payload);
          decoding.readVarUint(subtypeDecoder);
          const subtype = decoding.readVarUint(subtypeDecoder);
          if (subtype === syncProtocol.messageYjsUpdate) {
            broadcastBinary(room, socket, payload);
          }
          return;
        }

        broadcastBinary(room, socket, payload);
      } catch (error) {
        logger.error("Collab websocket message failed", error);
      }
    });

    socket.on("close", () => {
      room.clients.delete(socket);
      if (!room.clients.size) {
        room.doc.destroy();
        collabRooms.delete(roomName);
      }
    });
  });

  chatWss.on("connection", (socket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const workspaceId = url.searchParams.get("workspaceId") || "";
    void (async () => {
      try {
        // Check database health before proceeding
        if (!(await checkDatabaseHealth())) {
          socket.close(1011, "Server temporarily unavailable");
          return;
        }

        if (!workspaceId) {
          socket.close(4001, "Unauthorized");
          return;
        }

        const payload = await resolveWsAuth(workspaceId, token);
        if (!payload) {
          socket.close(4001, "Unauthorized");
          return;
        }

        const role = await getWorkspaceRole(workspaceId, payload.userId);
        if (!role) {
          socket.close(4003, "Forbidden");
          return;
        }

        const user = await usersCollection().findOne({ id: payload.userId });
        const username = user?.username || "unknown";
        const client: ChatClient = {
          socket,
          workspaceId,
          userId: payload.userId,
          username,
          activeResourceId: null,
        };

        if (!chatRooms.has(workspaceId)) {
          chatRooms.set(workspaceId, new Set<ChatClient>());
        }
        chatRooms.get(workspaceId)!.add(client);

        broadcastChatRoom(workspaceId, {
          type: "presence",
          workspaceId,
          users: Array.from(chatRooms.get(workspaceId) || []).map((c) => ({ userId: c.userId, username: c.username })),
        });

        socket.on("message", (raw) => {
          void (async () => {
            try {
              const msg = JSON.parse(raw.toString()) as {
                type?: string;
                content?: string;
                x?: number;
                y?: number;
                resourceId?: string;
                page?: string;
              };
              
              if (msg.type === "cursor:move") {
                if (
                  typeof msg.x !== "number" ||
                  typeof msg.y !== "number" ||
                  typeof msg.resourceId !== "string" ||
                  !msg.resourceId.trim()
                ) {
                  return;
                }

                const normalizedResourceId = msg.resourceId.trim();
                client.activeResourceId = normalizedResourceId;

                // Relay cursor position only to collaborators on the same logical resource/page.
                broadcastCursorRoom(workspaceId, normalizedResourceId, {
                  type: "cursor:update",
                  userId: payload.userId,
                  username,
                  resourceId: normalizedResourceId,
                  page: msg.page,
                  x: msg.x,
                  y: msg.y,
                  timestamp: Date.now(),
                });
                return;
              }

              if (msg.type !== "chat:send" || !msg.content?.trim()) {
                return;
              }

              const chatMessage: ChatMessageDoc = {
                id: randomUUID(),
                workspace_id: workspaceId,
                user_id: payload.userId,
                content: msg.content.trim(),
                created_at: nowIso(),
              };
              await chatCollection().insertOne(chatMessage);

              broadcastChatRoom(workspaceId, {
                type: "chat:new",
                id: chatMessage.id,
                workspaceId,
                userId: payload.userId,
                username,
                content: chatMessage.content,
                createdAt: chatMessage.created_at,
              });
            } catch (error) {
              logger.error("Chat socket message failed", error);
            }
          })();
        });

        socket.on("close", () => {
          const room = chatRooms.get(workspaceId);
          if (!room) return;

          room.delete(client);
          if (!room.size) {
            chatRooms.delete(workspaceId);
          } else {
            broadcastChatRoom(workspaceId, {
              type: "presence",
              workspaceId,
              users: Array.from(room).map((c) => ({ userId: c.userId, username: c.username })),
            });
          }
        });
      } catch (error) {
        logger.error("Chat websocket connection initialization failed", error);
        try {
          sendSocket(socket, { type: "chat:error", message: "Temporary server/database issue. Please retry." });
        } catch {
          // ignore socket send errors during shutdown
        }
        socket.close(1011, "Server error");
      }
    })();
  });

  terminalWss.on("connection", (socket, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") || "";
    const workspaceId = url.searchParams.get("workspaceId") || "";
    void (async () => {
      try {
        // Check database health before proceeding
        if (!(await checkDatabaseHealth())) {
          socket.close(1011, "Server temporarily unavailable");
          return;
        }

        if (!workspaceId) {
          socket.close(4001, "Unauthorized");
          return;
        }

        const payload = await resolveWsAuth(workspaceId, token);
        if (!payload) {
          socket.close(4001, "Unauthorized");
          return;
        }

        const role = await getWorkspaceRole(workspaceId, payload.userId);
        if (!role || roleRank[role] < roleRank.viewer) {
          socket.close(4003, "Forbidden");
          return;
        }

        let workspaceRuntimePath: string;
        let terminalCwd: string;
        let containerWorkingDir = "/workspace";
        try {
          workspaceRuntimePath = await materializeWorkspaceFiles(workspaceId);
          const workspaceFiles = await filesCollection().find({ workspace_id: workspaceId }).toArray();
          const preferredSubpath = detectPreferredTerminalSubpath(workspaceFiles);
          terminalCwd = preferredSubpath ? path.join(workspaceRuntimePath, preferredSubpath) : workspaceRuntimePath;
          containerWorkingDir = preferredSubpath ? `/workspace/${preferredSubpath.replace(/\\/g, "/")}` : "/workspace";
        } catch (error) {
          logger.error(`Failed to prepare workspace runtime path for ${workspaceId}`, error);
          sendSocket(socket, {
            type: "terminal:error",
            message: "Failed to prepare workspace runtime directory",
          });
          socket.close();
          return;
        }

        let ptyProcess: pty.IPty | null = null;
        const isWindows = process.platform === "win32";
        try {
          if (isDockerAvailable()) {
            try {
              ptyProcess = pty.spawn(
                "docker",
                [
                  "run",
                  "--rm",
                  "-i",
                  "-m",
                  "512m",
                  "--cpus",
                  "1",
                  "-v",
                  `${workspaceRuntimePath}:/workspace`,
                  "-w",
                  containerWorkingDir,
                  DOCKER_TERMINAL_IMAGE,
                  "bash",
                ],
                {
                  name: "xterm-color",
                  cols: 120,
                  rows: 30,
                  cwd: terminalCwd,
                  env: process.env as Record<string, string>,
                }
              );
            } catch (dockerError) {
              logger.info("Docker terminal unavailable, falling back to local shell", dockerError);
            }
          } else {
            if (!dockerFallbackLogged) {
              logger.info("Docker CLI not found, falling back to local shell");
              dockerFallbackLogged = true;
            }
          }

          if (!ptyProcess) {
            if (isWindows) {
              const windowsShells: Array<{ cmd: string; args: string[] }> = [
                { cmd: "pwsh.exe", args: ["-NoLogo", "-NoProfile"] },
                { cmd: "cmd.exe", args: [] },
              ];
              let spawned = false;
              let lastError: unknown = null;

              for (const candidate of windowsShells) {
                try {
                  ptyProcess = pty.spawn(candidate.cmd, candidate.args, {
                    name: "xterm-color",
                    cols: 120,
                    rows: 30,
                    cwd: terminalCwd,
                    env: {
                      ...(process.env as Record<string, string>),
                      TERM: "xterm-256color",
                      COLORTERM: "truecolor",
                    },
                  });
                  spawned = true;
                  break;
                } catch (shellError) {
                  lastError = shellError;
                }
              }

              if (!spawned) {
                throw lastError || new Error("No Windows shell available");
              }
            } else {
              ptyProcess = pty.spawn(process.env.SHELL || "sh", [], {
                name: "xterm-color",
                cols: 120,
                rows: 30,
                cwd: terminalCwd,
                env: {
                  ...(process.env as Record<string, string>),
                  TERM: "xterm-256color",
                  COLORTERM: "truecolor",
                  LANG: process.env.LANG || "en_US.UTF-8",
                  LC_ALL: process.env.LC_ALL || "en_US.UTF-8",
                },
              });
            }
          }
        } catch (fallbackError) {
          sendSocket(socket, {
            type: "terminal:error",
            message: `Unable to start terminal session: ${(fallbackError as Error).message}`,
          });
          socket.close();
          return;
        }

        if (!ptyProcess) {
          sendSocket(socket, {
            type: "terminal:error",
            message: "Unable to start terminal process",
          });
          socket.close();
          return;
        }

        ptyProcess.onData((data) => {
          if (socket.readyState === WebSocket.OPEN) {
            const normalized = data.replace(/\r\n/g, "\n");
            socket.send(normalized);
          }
        });

        ptyProcess.onExit(({ exitCode }) => {
          sendSocket(socket, { type: "terminal:exit", exitCode });
          socket.close();
        });

        socket.on("message", (raw) => {
          try {
            const rawText = typeof raw === "string"
              ? raw
              : raw instanceof ArrayBuffer
                ? new TextDecoder("utf-8").decode(new Uint8Array(raw))
                : Buffer.isBuffer(raw)
                  ? raw.toString()
                  : Buffer.from(raw as unknown as Uint8Array).toString();

            console.log("received:", rawText);

            if (rawText.startsWith("{") && rawText.endsWith("}")) {
              try {
                const msg = JSON.parse(rawText) as { type?: string; data?: string; cols?: number; rows?: number };
                if (msg.type === "terminal:resize" && typeof msg.cols === "number" && typeof msg.rows === "number") {
                  const cols = Math.max(1, Math.floor(msg.cols));
                  const rows = Math.max(1, Math.floor(msg.rows));
                  ptyProcess.resize(cols, rows);
                  return;
                }
                if (msg.type === "terminal:input" && typeof msg.data === "string") {
                  ptyProcess.write(msg.data);
                  return;
                }
              } catch {
                // Fall through to raw PTY write.
              }
            }

            ptyProcess.write(rawText);
          } catch (error) {
            logger.error("Terminal message parse failed", error);
          }
        });

        socket.on("close", () => {
          ptyProcess.kill();
        });
      } catch (error) {
        logger.error("Terminal websocket connection initialization failed", error);
        try {
          sendSocket(socket, { type: "terminal:error", message: "Temporary server/database issue. Please retry." });
        } catch {
          // ignore socket send errors during shutdown
        }
        socket.close(1011, "Server error");
      }
    })();
  });

  server.on("upgrade", (request, socket, head) => {
    const pathname = new URL(request.url || "", `http://${request.headers.host}`).pathname;

    if (pathname.startsWith("/collab")) {
      yjsWss.handleUpgrade(request, socket, head, (ws) => {
        yjsWss.emit("connection", ws, request);
      });
      return;
    }

    if (pathname === "/ws/chat") {
      chatWss.handleUpgrade(request, socket, head, (ws) => {
        chatWss.emit("connection", ws, request);
      });
      return;
    }

    if (pathname === "/ws/terminal") {
      terminalWss.handleUpgrade(request, socket, head, (ws) => {
        terminalWss.emit("connection", ws, request);
      });
      return;
    }

    socket.destroy();
  });
};

const startServer = async (): Promise<void> => {
  logger.info("Starting backend services...");
  await fs.mkdir(DEPLOYMENTS_ROOT, { recursive: true });
  await connectDatabase();
  await ensureIndexes();
  await createDefaultAdmin();
  createRealtimeServers();

  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Health: http://localhost:${PORT}/health`);
    logger.info("Realtime endpoints: /collab, /ws/chat, /ws/terminal");
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      logger.error(`Port ${PORT} is already in use. Please free the port and restart.`);
      process.exit(1);
    } else {
      logger.error("Server error", err);
      process.exit(1);
    }
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error: NodeJS.ErrnoException) => {
  if (error.code === "EADDRINUSE") {
    logger.error(`Port ${PORT} already in use. Free the port and restart.`);
    process.exit(1);
  } else {
    logger.error("Uncaught exception", error);
  }
});

const gracefulShutdown = () => {
  logger.info("Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed. Port released.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
