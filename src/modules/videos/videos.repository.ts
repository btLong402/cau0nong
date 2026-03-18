/**
 * Videos Repository
 * Data access layer for videos table
 */

import { Repository } from "@/shared/lib/repository";
import { createServerSupabaseClient } from "@/lib/supabase";
import type { Video } from "./types";
import { SupabaseClient } from "@supabase/supabase-js";

export class VideosRepository extends Repository<Video> {
  constructor(supabaseClient: SupabaseClient) {
    super(supabaseClient, "videos");
  }

  /**
   * Find videos, optionally filtered by category
   */
  async findVideos(category?: string): Promise<Video[]> {
    let query = this.supabase
      .from(this.tableName)
      .select("*")
      .order("created_at", { ascending: false });

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) throw this.mapError(error);
    return (data || []) as Video[];
  }

  /**
   * Create video
   */
  async createVideo(data: {
    title: string;
    youtube_url: string;
    description?: string;
    category?: string;
    created_by?: string;
  }): Promise<Video> {
    return this.create(data as any);
  }

  /**
   * Update video
   */
  async updateVideo(
    id: number,
    data: Partial<{
      title: string;
      youtube_url: string;
      description: string;
      category: string;
    }>
  ): Promise<Video> {
    return this.update(id, {
      ...data,
      updated_at: new Date().toISOString(),
    } as any);
  }

  /**
   * Delete video
   */
  async deleteVideo(id: number): Promise<boolean> {
    return this.delete(id);
  }
}

export async function createVideosRepository(): Promise<VideosRepository> {
  const supabase = await createServerSupabaseClient();
  return new VideosRepository(supabase);
}
