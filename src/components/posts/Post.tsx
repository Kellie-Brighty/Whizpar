import React, { useState, useEffect } from "react";
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
import { supabase } from "../../lib/supabase";
import { createSocket } from "../../lib/socket";

const { width } = Dimensions.get("window");

interface PostProps {
  post: PostType;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLike?: () => void;
  likeAnimatedStyle?: any;
  user: any;
}

export const Post: React.FC<PostProps> = ({
  post,
  onPressIn,
  onPressOut,
  onLike,
  likeAnimatedStyle,
  user,
}) => {
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(post?.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const heartScale = useSharedValue(0);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

  const socket = createSocket(user?.id);

  useEffect(() => {
    setLocalLikes(post?.likes || 0);
  }, [post?.likes]);

  useEffect(() => {
    if (!user) return;

    // Check initial like status
    const checkLikeStatus = async () => {
      const { data } = await supabase
        .from("post_likes")
        .select()
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .single();

      setLiked(!!data);
    };

    checkLikeStatus();
  }, [post.id, user]);

  const handleLike = async () => {
    if (!user) return;

    const newLikedState = !liked;
    setLiked(newLikedState);
    setLocalLikes((prev) => (newLikedState ? prev + 1 : prev - 1));

    // Emit like event to socket server
    socket.emit("like_post", {
      postId: post.id,
      userId: user.id,
      liked: newLikedState,
    });
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

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Add comment logic here
      setNewComment("");
      setIsAddingComment(false);
      Keyboard.dismiss();
    }
  };

  return (
    <TapGestureHandler numberOfTaps={2} onActivated={handleLike}>
      <Animated.View style={styles.container}>
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <RandomAvatar
                seed={post?.profile?.avatar_seed || "default"}
                size={40}
              />
              <View style={styles.headerText}>
                <Text style={styles.username}>Anonymous</Text>
                <Text style={styles.time}>
                  {formatTimeAgo(post?.created_at || new Date().toISOString())}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moreButton}>
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

          <Text style={styles.contentText}>{post?.content}</Text>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.footerItem} onPress={handleLike}>
              <Icon
                name={liked ? "heart" : "heart-outline"}
                size={20}
                color={liked ? "#FF4D9C" : "#7C4DFF"}
              />
              <Text style={[styles.footerText, liked && { color: "#FF4D9C" }]}>
                {localLikes}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerItem}
              onPress={() => setShowComments(!showComments)}
            >
              <Icon name="comment-outline" size={20} color="#7C4DFF" />
              <Text style={styles.footerText}>0</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showComments && (
          <View style={styles.commentsSection}>
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newComment.trim() && styles.sendButtonDisabled,
                ]}
                disabled={!newComment.trim()}
              >
                <Icon name="send" size={20} color="#7C4DFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.commentsList}>
              {/* Dummy comment for UI */}
              <View style={styles.commentItem}>
                <RandomAvatar seed="dummy1" size={32} />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUsername}>Anonymous</Text>
                  <Text style={styles.commentText}>
                    This is a sample comment
                  </Text>
                  <View style={styles.commentActions}>
                    <Text style={styles.commentTime}>2m ago</Text>
                    <TouchableOpacity>
                      <Text style={styles.replyButton}>Reply</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Sample reply */}
                  <View style={styles.replyContainer}>
                    <RandomAvatar seed="dummy2" size={24} />
                    <View style={styles.replyContent}>
                      <Text style={styles.commentUsername}>Anonymous</Text>
                      <Text style={styles.commentText}>
                        This is a sample reply
                      </Text>
                      <Text style={styles.commentTime}>1m ago</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}
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
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontFamily: fonts.regular,
    color: "#7C4DFF",
    fontSize: 13,
  },
  moreButton: {
    padding: 4,
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: "#2A2A2A",
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: 400,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  commentTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  addCommentButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addCommentText: {
    color: "#7C4DFF",
    fontSize: 14,
    marginLeft: 4,
  },
  commentsScrollView: {
    maxHeight: 350,
  },
  addCommentContainer: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2A2A",
    paddingBottom: 12,
  },
  commentInput: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  commentActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cancelButton: {
    marginRight: 12,
    padding: 6,
  },
  cancelText: {
    color: "#6B6B6B",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  submitButtonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  commentCount: {
    fontFamily: fonts.regular,
    color: "#6B6B6B",
    fontSize: 14,
    marginLeft: 4,
  },
  likeCount: {
    fontFamily: fonts.semiBold,
    color: "#7C4DFF",
    fontSize: 14,
    marginLeft: 4,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(124, 77, 255, 0.1)",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  commentItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  commentText: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 14,
  },
  commentTime: {
    fontFamily: fonts.regular,
    color: "#6B6B6B",
    fontSize: 12,
  },
  replyButton: {
    fontFamily: fonts.regular,
    color: "#7C4DFF",
    fontSize: 14,
  },
  replyContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  replyContent: {
    flex: 1,
  },
  commentsList: {
    maxHeight: 350,
    overflow: "hidden",
  },
});
