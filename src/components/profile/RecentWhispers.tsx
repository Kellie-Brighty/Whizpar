import React, { useEffect, useMemo } from "react";
import { View } from "react-native";
import { Post } from "../posts/Post";

import { useAuth } from "../../contexts/AuthContext";
import { Post as PostType, postService } from "../../services/postService";

interface RecentWhispersProps {
  posts: PostType[];
  setPosts: React.Dispatch<React.SetStateAction<PostType[]>>;
}

export const RecentWhispers = ({ posts, setPosts }: RecentWhispersProps) => {
  const { user } = useAuth();
  useEffect(() => {
    // Subscribe to new posts
    const unsubscribeNewPosts = postService.subscribeToNewPosts((newPost) => {
      // Only add if it belongs to the current user
      if (newPost.user_id === user?.uid) {
        setPosts((prev) => [newPost, ...prev]);
      }
    });

    // Subscribe to engagement updates
    const unsubscribeEngagements = postService.subscribeToPostEngagements((updatedPost) => {
       setPosts((prev) => 
        prev.map((post) => 
          post.id === updatedPost.id ? { ...post, ...updatedPost } : post
        )
       );
    });

    return () => {
      unsubscribeNewPosts();
      unsubscribeEngagements();
    };
  }, [user?.uid]);

  return (
    <View>
      {posts.map((post) => (
        <Post key={post.id} post={post} user={user} />
      ))}
    </View>
  );
};
