import { supabase } from "../lib/supabase";
import { createSocket } from "../lib/socket";

export type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes: number;
  liked?: boolean;
  replies?: Array<{
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    likes: number;
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
  comment_count: number;
  profile: {
    username: string;
    avatar_seed: string;
  };
  comments?: Comment[];
  view_count: number;
  isViewable?: boolean;
};

type PostgresChangesPayload = {
  new: { [key: string]: any };
  old: { [key: string]: any };
};

interface CommentType {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes: number;
  parent_id: string | null;
}

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
      const { data: commentCounts } = await supabase
        .rpc("get_comment_counts_by_post")
        .select();

      // Update the posts query to properly structure comments and replies
      const query = supabase.from("posts").select(`
        *,
        profile:profiles(username, avatar_seed),
        comments:comments!post_id(
          id,
          content,
          user_id,
          created_at,
          likes,
          parent_id
        )
      `);

      if (type === "trending") {
        query.gt("likes", 0).order("likes", { ascending: false });
      } else {
        query.order("created_at", { ascending: false });
      }

      const { data: posts, error } = await query;

      if (error) throw error;

      // Structure comments and replies
      if (posts) {
        const postsWithComments = posts.map((post) => {
          const comments = post.comments || [];
          const topLevelComments = comments.filter(
            (c: CommentType) => !c.parent_id
          );
          const replies = comments.filter((c: CommentType) => c.parent_id);

          const commentsWithReplies = topLevelComments.map(
            (comment: CommentType) => ({
              ...comment,
              replies: replies.filter(
                (reply: CommentType) => reply.parent_id === comment.id
              ),
            })
          );

          return {
            ...post,
            comments: commentsWithReplies,
            comment_count:
              commentCounts?.find(
                (c: { post_id: string; count: number }) => c.post_id === post.id
              )?.count || 0,
            engagement:
              (post.likes || 0) +
              Number(
                commentCounts?.find(
                  (c: { post_id: string; count: number }) =>
                    c.post_id === post.id
                )?.count || 0
              ) *
                2,
          };
        });

        if (type === "trending") {
          postsWithComments.sort((a, b) => b.engagement - a.engagement);
        }

        return { posts: postsWithComments as Post[], error: null };
      }

      return { posts: null, error };
    } catch (error) {
      console.error("Error fetching posts:", error);
      return { posts: null, error };
    }
  },

  getComments: async (postId: string) => {
    try {
      // First get all comments for this post
      const { data: allComments, error } = await supabase
        .from("comments")
        .select(
          `
          id,
          content,
          user_id,
          created_at,
          likes,
          parent_id
        `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Separate top-level comments and replies
      const topLevelComments = allComments?.filter(
        (comment) => comment.parent_id === null
      );
      const replies = allComments?.filter(
        (comment) => comment.parent_id !== null
      );

      // Attach replies to their parent comments
      const commentsWithReplies = topLevelComments?.map((comment) => ({
        ...comment,
        replies:
          replies?.filter((reply) => reply.parent_id === comment.id) || [],
      }));

      return { comments: commentsWithReplies as Comment[], error: null };
    } catch (error) {
      console.error("Error fetching comments:", error);
      return { comments: null, error };
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
        async (payload: PostgresChangesPayload) => {
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

    const channel = supabase
      .channel("post-engagements")
      // Listen to post changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
        },
        async (payload: PostgresChangesPayload) => {
          console.log("Post change detected:", payload);

          const { data: post } = await supabase
            .from("posts")
            .select(
              `
              *,
              profile:profiles(username, avatar_seed)
            `
            )
            .eq("id", payload.new.id)
            .single();

          if (post) {
            callback(post);
          }
        }
      )
      // Listen to like changes
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "post_likes",
        },
        async (payload: PostgresChangesPayload) => {
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
              .single(),
          ]);

          if (post) {
            const updatedPost = {
              ...post,
              likes: likesCount?.length || 0,
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

  registerView: async (postId: string, userId: string) => {
    try {
      const socket = createSocket(userId);
      console.log("🔌 Socket state for view registration:", {
        postId,
        userId,
        socketConnected: socket.connected,
        socketId: socket.id,
      });

      socket.emit("register_view", {
        postId,
        userId,
      });
      console.log("📤 Emitted register_view event");

      return { error: null };
    } catch (error) {
      console.error("❌ Error registering view:", error);
      return { error };
    }
  },
};
