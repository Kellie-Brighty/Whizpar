import { supabase } from "../lib/supabase";

export type Comment = {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: Array<{
    id: string;
    username: string;
    content: string;
    createdAt: string;
    likes: number;
    replies: never[];
  }>;
};

export type Post = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  image_url: string | null;
  likes: number;
  engagement: number;
  profile: {
    username: string;
    avatar_seed: string;
  };
};

export const postService = {
  createPost: async (content: string, userId: string, imageUrl?: string) => {
    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            content,
            user_id: userId,
            image_url: imageUrl,
            likes: 0,
          },
        ])
        .select(
          `
          *,
          profile:profiles(username, avatar_seed)
        `
        )
        .single();

      if (error) throw error;
      return { post: data as Post, error: null };
    } catch (error) {
      console.error("Error creating post:", error);
      return { post: null, error };
    }
  },

  getPosts: async (type: "trending" | "latest" = "latest") => {
    try {
      const query = supabase.from("posts").select(`
        *,
        profile:profiles(username, avatar_seed),
        post_likes(count)
      `);

      if (type === "trending") {
        // Only show posts with likes > 0 in trending
        query.gt("likes", 0).order("likes", { ascending: false });
      } else {
        // Show all posts in latest, ordered by creation time
        query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      return { posts: data as Post[], error: null };
    } catch (error) {
      console.error("Error fetching posts:", error);
      return { posts: null, error };
    }
  },

  subscribeToNewPosts: (callback: (post: Post) => void) => {
    const subscription = supabase
      .channel("public:posts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
        },
        async (payload) => {
          const { data, error } = await supabase
            .from("posts")
            .select(
              `
              *,
              profile:profiles(username, avatar_seed)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (!error && data) {
            callback(data as Post);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  },

  likePost: async (
    postId: string,
    userId: string
  ): Promise<{ success: boolean; error: any }> => {
    try {
      // Check if user already liked the post
      const { data: existingLike, error: checkError } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", postId)
        .eq("user_id", userId)
        .single();

      console.log("Checking like status:", { existingLike, checkError });

      if (existingLike) {
        // Unlike
        const { error: deleteLikeError } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        console.log("Deleting like:", { deleteLikeError });
        if (deleteLikeError) throw deleteLikeError;

        // Update likes count
        const { data: likesCount } = await supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .eq("post_id", postId);

        const { data: updateData, error: updateError } = await supabase
          .from("posts")
          .update({ likes: likesCount?.length || 0 })
          .eq("id", postId)
          .select();

        console.log("Update result:", { updateData, updateError });
        if (updateError) throw updateError;
      } else {
        // Like
        const { error: insertError } = await supabase
          .from("post_likes")
          .insert({
            post_id: postId,
            user_id: userId,
          });

        console.log("Inserting like:", { insertError });
        if (insertError) throw insertError;

        // Update likes count
        const { data: likesCount } = await supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .eq("post_id", postId);

        const { data: updateData, error: updateError } = await supabase
          .from("posts")
          .update({ likes: likesCount?.length || 0 })
          .eq("id", postId)
          .select();

        console.log("Update result:", { updateData, updateError });
        if (updateError) throw updateError;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error("Error toggling like:", error);
      return { success: false, error };
    }
  },

  subscribeToPostEngagements: (callback: (post: Post) => void) => {
    console.log("Setting up post engagements subscription");
    
    const channel = supabase.channel('post-engagements')
      // Listen to post changes
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public',
          table: 'posts' 
        },
        async (payload) => {
          console.log("Post change detected:", payload);
          
          const { data: post } = await supabase
            .from('posts')
            .select(`
              *,
              profile:profiles(username, avatar_seed)
            `)
            .eq('id', payload.new.id)
            .single();

          if (post) {
            callback(post);
          }
        }
      )
      // Listen to like changes
      .on(
        'postgres_changes',
        { 
          event: '*',
          schema: 'public',
          table: 'post_likes' 
        },
        async (payload) => {
          console.log("Like change detected:", payload);
          
          const postId = payload.new?.post_id || payload.old?.post_id;
          
          if (!postId) return;

          // Get updated likes count and post data
          const [{ data: likesCount }, { data: post }] = await Promise.all([
            supabase
              .from("post_likes")
              .select("id", { count: "exact" })
              .eq("post_id", postId),
            supabase
              .from("posts")
              .select(`*, profile:profiles(username, avatar_seed)`)
              .eq("id", postId)
              .single()
          ]);

          if (post) {
            const updatedPost = {
              ...post,
              likes: likesCount?.length || 0
            };

            // Update the post with new likes count
            await supabase
              .from("posts")
              .update({ likes: updatedPost.likes })
              .eq("id", postId);

            callback(updatedPost);
          }
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up post engagements subscription");
      supabase.removeChannel(channel);
    };
  },
};
