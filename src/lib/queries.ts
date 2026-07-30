import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Position = {
  id: string;
  title: string;
  display_order: number;
};

export type Candidate = {
  id: string;
  position_id: string;
  name: string;
  class: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
  display_order: number;
};

export type Settings = {
  id: number;
  website_name: string;
  logo_url: string | null;
  election_status: string;
  start_time: string;
  end_time: string;
};

export const positionsQuery = () =>
  queryOptions({
    queryKey: ["positions"],
    queryFn: async (): Promise<Position[]> => {
      const { data, error } = await supabase
        .from("positions")
        .select("id, title, display_order")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const candidatesQuery = () =>
  queryOptions({
    queryKey: ["candidates"],
    queryFn: async (): Promise<Candidate[]> => {
      const { data, error } = await supabase
        .from("candidates")
        .select("id, position_id, name, class, bio, image_url, is_active, display_order")
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: async (): Promise<Settings | null> => {
      const { data, error } = await supabase
        .from("settings")
        .select("id, website_name, logo_url, election_status, start_time, end_time")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
