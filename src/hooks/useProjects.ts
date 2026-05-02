import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useProjects = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, project_members(count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
};

export const useProjectMembers = (projectId: string) => {
  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select("*, profiles(full_name)")
        .eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ name, description, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, email, role }: { projectId: string; email: string; role: "admin" | "member" }) => {
      // Look up user by email from profiles — we need a workaround since we can't query auth.users
      // We'll use the user's id directly — the admin must provide user email
      // First, find user via a custom approach: try to find the profile
      const { data: users, error: lookupError } = await supabase
        .from("profiles")
        .select("id")
        .limit(100);
      if (lookupError) throw lookupError;

      // We need to find the user by email — since profiles don't store email,
      // we'll use a different approach: the inviter provides the user_id or we look up via RPC
      // For now, we use a simpler approach with edge function or direct user_id
      throw new Error("Please use the user ID to add members. Email lookup requires additional setup.");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", variables.projectId] });
    },
  });
};

export const useAddMemberById = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId, role }: { projectId: string; userId: string; role: "admin" | "member" }) => {
      const { error } = await supabase
        .from("project_members")
        .insert({ project_id: projectId, user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-members", variables.projectId] });
    },
  });
};