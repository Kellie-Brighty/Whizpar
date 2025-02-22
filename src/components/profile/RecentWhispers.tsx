import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Post } from "../posts/Post";
import { createSocket } from "../../lib/socket";
import { useAuth } from "../../contexts/AuthContext";
import { Post as PostType } from "../../services/postService";

interface RecentWhispersProps {
  posts: PostType[];
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>;
}

export const RecentWhispers = ({ posts, setPosts }: RecentWhispersProps) => {
  const { user } = useAuth();
  const socket = useMemo(() => createSocket(user?.id), [user?.id]);

  useEffect(() => {
    // Listen for new posts
    socket.on("new_post", (newPost) => {
      if (newPost.user_id === user?.id) {
        setPosts((prev) => [newPost, ...prev]);
      }
    });

    // Listen for like updates
    socket.on("like_update", ({ postId, likesCount }) => {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, likes: likesCount } : post
        )
      );
    });

    return () => {
      socket.off("new_post");
      socket.off("like_update");
    };
  }, [socket, user?.id]);

  return (
    <View>
      {posts.map((post) => (
        <Post key={post.id} post={post} user={user} />
      ))}
    </View>
  );
};
