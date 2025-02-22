import express from "express";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface CustomSocket extends Socket {
  userId?: string;
}

io.use((socket: CustomSocket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) {
    return next(new Error("Invalid user"));
  }
  socket.userId = userId;
  next();
});

io.on("connection", (socket: CustomSocket) => {
  console.log(`User ${socket.userId} connected`);

  socket.on(
    "like_post",
    async (data: { postId: string; userId: string; liked: boolean }) => {
      try {
        const { postId, userId, liked } = data;

        if (liked) {
          await supabase
            .from("post_likes")
            .insert({ post_id: postId, user_id: userId });
        } else {
          await supabase
            .from("post_likes")
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId);
        }

        // Get updated likes count
        const { data: likes } = await supabase
          .from("post_likes")
          .select("id", { count: "exact" })
          .eq("post_id", postId);

        const likesCount = likes?.length || 0;

        // Update the posts table with new likes count
        await supabase
          .from("posts")
          .update({ likes: likesCount })
          .eq("id", postId);

        // Broadcast to all clients including sender
        io.emit("like_update", {
          postId,
          likesCount,
          userId,
          liked,
        });

        console.log(
          `Broadcasting like update: post ${postId} now has ${likesCount} likes`
        );
      } catch (error) {
        console.error("Error handling like:", error);
      }
    }
  );

  socket.on(
    "create_post",
    async (data: { content: string; userId: string; image?: string }) => {
      try {
        const { data: post, error } = await supabase
          .from("posts")
          .insert([
            {
              content: data.content,
              user_id: data.userId,
              image_url: data.image,
            },
          ])
          .select(
            `
            id,
            content,
            image_url,
            created_at,
            likes,
            profile:profiles(username, avatar_seed)
          `
          )
          .single();

        if (error) throw error;

        // Broadcast to all clients
        io.emit("new_post", post);
      } catch (error) {
        console.error("Error creating post:", error);
        socket.emit("post_error", { message: "Failed to create post" });
      }
    }
  );
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
