
-- Workspaces table
CREATE TABLE public.workspaces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL,
  share_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  max_members INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Workspace members table
CREATE TABLE public.workspace_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'offline')),
  is_online BOOLEAN NOT NULL DEFAULT false,
  location TEXT,
  last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspace files table (persisted file tree)
CREATE TABLE public.workspace_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'folder')),
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'plaintext',
  parent_path TEXT,
  last_modified_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.workspace_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they own or are members of"
  ON public.workspaces FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their workspaces"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their workspaces"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for workspace_members
CREATE POLICY "Members can view workspace members"
  ON public.workspace_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members wm WHERE wm.workspace_id = workspace_members.workspace_id AND wm.user_id = auth.uid())
  );

CREATE POLICY "Workspace owners can insert members"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

CREATE POLICY "Members can update their own status"
  ON public.workspace_members FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Workspace owners can delete members"
  ON public.workspace_members FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- RLS Policies for workspace_files
CREATE POLICY "Members can view workspace files"
  ON public.workspace_files FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_files.workspace_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can insert workspace files"
  ON public.workspace_files FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_files.workspace_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can update workspace files"
  ON public.workspace_files FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.workspace_members WHERE workspace_id = workspace_files.workspace_id AND user_id = auth.uid())
  );

CREATE POLICY "Owners can delete workspace files"
  ON public.workspace_files FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.workspaces WHERE id = workspace_id AND owner_id = auth.uid())
  );

-- Enable realtime for members (online/offline tracking)
ALTER PUBLICATION supabase_realtime ADD TABLE public.workspace_members;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_files_updated_at
  BEFORE UPDATE ON public.workspace_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
