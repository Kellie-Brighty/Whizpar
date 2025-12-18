import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Post as PostType, postService } from "../../services/postService";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Surface } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withSequence,
  runOnJS,
  withTiming,
  useSharedValue,
} from "react-native-reanimated";
import {
  TapGestureHandler,
  State,
  GestureHandlerStateChangeNativeEvent,
} from "react-native-gesture-handler";
import { Comment } from "../comments/Comment";
import { fonts } from "../../theme/fonts";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { RandomAvatar } from "../RandomAvatar";
import { LinearGradient } from "expo-linear-gradient";
import * as Crypto from 'expo-crypto';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CommentsSheet } from "../sheets/CommentsSheet";
import { PostOptionsSheet } from "../sheets/PostOptionsSheet";

const { width, height } = Dimensions.get("window");

interface PostProps {
  post: PostType;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLike?: () => void;
  likeAnimatedStyle?: any;
  user: any;
  onViewableItemsChanged?: boolean;
}

export const Post: React.FC<PostProps> = ({
  post,
  onPressIn,
  onPressOut,
  onLike,
  likeAnimatedStyle,
  user,
  onViewableItemsChanged,
}) => {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post?.likes || 0);
  const heartScale = useSharedValue(0);
  const [currentPost, setCurrentPost] = useState<PostType>(post);
  const [commentCount, setCommentCount] = useState(post?.comments?.length || 0);
  const [hasViewed, setHasViewed] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);

  // Add ref for bottom sheet
  const commentsSheetRef = useRef<BottomSheetModal>(null);
  const optionsSheetRef = useRef<BottomSheetModal>(null);

  // Memoize snap points
  // const snapPoints = useMemo(() => ["100%"], []); // CommentsSheet now handles this

  useEffect(() => {
    setLocalLikes(post?.likes || 0);
  }, [post?.likes]);

  useEffect(() => {
    if (!user) return;

    // Check initial like status
    const checkLikeStatus = async () => {
      const likeRef = doc(db, 'post_likes', `${post.id}_${user.uid}`);
      const likeSnap = await getDoc(likeRef);
      setLiked(likeSnap.exists());
    };

    checkLikeStatus();
  }, [post.id, user]);

  // Sync local state when post prop updates (from FeedScreen subscription)
  useEffect(() => {
    setCurrentPost((prev) => ({
      ...post,
      comments: prev.comments, // Preserve local comments (including optimistic updates)
    }));
    // Only update counts if they come from the server update
    setCommentCount(post.comment_count || 0);
    setLocalLikes(post.likes || 0);
  }, [post]);

  useEffect(() => {
    const fetchComments = async () => {
      const { comments } = await postService.getComments(post.id);
      if (comments) {
        setCurrentPost((prev) => ({ ...prev, comments }));
        setCommentCount(comments.length);
      }
    };

    fetchComments();
  }, [post.id]);

  useEffect(() => {
    const initializeViewer = async () => {
      let id = await AsyncStorage.getItem("@viewer_id");
      if (!id) {
        id = Crypto.randomUUID();
        await AsyncStorage.setItem("@viewer_id", id);
      }
      setViewerId(id);
    };

    initializeViewer();
  }, []);

  // Handle view tracking
  const handleView = useCallback(async () => {
    if (!hasViewed && user?.uid) {
      try {
        await postService.registerView(post.id, user.uid);
        setHasViewed(true);
      } catch (error) {
        console.error("View registration failed:", error);
      }
    }
  }, [hasViewed, user?.uid, post.id]);

  useEffect(() => {
    if (onViewableItemsChanged === true && !hasViewed) {
      console.log("🔍 View timer starting for post:", {
        postId: post.id,
        hasViewed,
        onViewableItemsChanged,
      });
      const timer = setTimeout(async () => {
        console.log("⏰ Timer finished, calling handleView for post:", post.id);
        await handleView();
      }, 3000);
      return () => {
        console.log("🧹 Cleaning up timer for post:", post.id);
        clearTimeout(timer);
      };
    }
  }, [onViewableItemsChanged, hasViewed]);

  const handleLike = async () => {
    if (!user) return;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLocalLikes((prev) => (newLikedState ? prev + 1 : prev - 1));

    try {
      await postService.likePost(post.id, user.uid);
    } catch (error) {
      console.error("Error liking post:", error);
      // Revert on error
      setLiked(!newLikedState);
      setLocalLikes((prev) => (!newLikedState ? prev + 1 : prev - 1));
    }
  };

  const onDoubleTap = ({
    nativeEvent,
  }: {
    nativeEvent: GestureHandlerStateChangeNativeEvent;
  }) => {
    if (nativeEvent.state === State.ACTIVE) {
      if (!liked) {
        setLiked(true);
        heartScale.value = withSequence(
          withSpring(1, { damping: 5, stiffness: 200 }),
          withTiming(0, { duration: 300 }, () => {
            runOnJS(setLiked)(true);
          })
        );
      }
    }
  };

  const heartStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: heartScale.value }],
      opacity: heartScale.value,
    };
  });

  const handleShowComments = () => {
    commentsSheetRef.current?.present();
  };

  const handleEditSuccess = (newContent: string) => {
    setCurrentPost(prev => ({ ...prev, content: newContent }));
  };

  return (
    <TapGestureHandler numberOfTaps={2} onActivated={handleLike}>
      <Animated.View style={styles.container}>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <RandomAvatar
                seed={post.id}
                size={40}
              />
              <View style={styles.headerText}>
                <Text style={styles.username}>Anonymous</Text>
                <Text style={styles.time}>
                  {formatTimeAgo(post?.created_at || new Date().toISOString())}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => optionsSheetRef.current?.present()}
            >
              <Icon
                name="dots-horizontal"
                size={20}
                color="rgba(255,255,255,0.5)"
              />
            </TouchableOpacity>
          </View>

          {post?.image_url && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: post.image_url }}
                style={styles.image}
                resizeMode="cover"
              />
            </View>
          )}

          <Text style={styles.contentText}>{currentPost?.content}</Text>

          <View style={styles.footer}>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <TouchableOpacity style={styles.footerItem} onPress={handleLike}>
                <Icon
                  name={liked ? "heart" : "heart-outline"}
                  size={20}
                  color={liked ? "#FF4D9C" : "rgba(255, 255, 255, 0.6)"}
                />
                <Text
                  style={[styles.footerText, liked && { color: "#FF4D9C" }]}
                >
                  {localLikes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.footerItem}
                onPress={handleShowComments}
              >
                <Icon name="comment-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
                <Text style={styles.footerText}>{commentCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.footerItem, { alignSelf: "flex-end" }]}>
              <Icon name="eye-outline" size={20} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.footerText}>{post.view_count || 0}</Text>
            </View>
          </View>
        </View>

        <CommentsSheet
          ref={commentsSheetRef}
          postId={post.id}
          comments={currentPost.comments || []}
          user={user}
          onCommentAdded={(newComment) => {
            setCurrentPost((prev) => ({
              ...prev,
              comments: [{ ...newComment, replies: [] }, ...(prev.comments || [])]
            }));
            setCommentCount((prev) => prev + 1);
          }}
          onReplyAdded={(parentId, reply) => {
            setCurrentPost((prev) => ({
              ...prev,
              comments: prev.comments?.map((c) => {
                if (c.id === parentId) {
                  return {
                    ...c,
                    replies: [...(c.replies || []), reply]
                  };
                }
                return c;
              })
            }));
          }}
        />

        <PostOptionsSheet
          ref={optionsSheetRef}
          post={currentPost}
          currentUserId={user?.uid}
          onEditSuccess={handleEditSuccess}
        />
      </Animated.View>
    </TapGestureHandler>
  );
};



const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    // Removed shadows/elevation
    flex: Platform.OS === "ios" ? 1 : undefined,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerText: {
    marginLeft: 10,
  },
  username: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  time: {
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
  },
  contentText: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
    borderColor: "rgba(84, 84, 84, 0.5)",
    borderWidth: 0.5,
    borderRadius: 5,
    padding: 10,
    marginHorizontal: -16,
  },
  imageContainer: {
    marginHorizontal: -16,
    marginBottom: 12,
  },
  image: {
    width: "100%",
    height: 200,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  footer: {
    flexDirection: "row",
    gap: 16,
    marginTop: 4,
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontFamily: fonts.regular,
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
  },
  moreButton: {
    padding: 4,
  },
});
