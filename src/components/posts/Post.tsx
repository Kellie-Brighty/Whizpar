import React, { useState, useEffect, useRef } from "react";
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
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";

const { width, height } = Dimensions.get("window");

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
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const heartScale = useSharedValue(0);
  const [currentPost, setCurrentPost] = useState<PostType>(post);
  const [commentCount, setCommentCount] = useState(post?.comments?.length || 0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

  const socket = createSocket(user?.id);

  // Add ref for bottom sheet
  const commentsSheetRef = useRef<BottomSheetModal>(null);

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

  useEffect(() => {
    // Listen for new comments
    socket.on("new_comment", (newComment) => {
      console.log("Received new comment:", {
        id: newComment.id,
        content: newComment.content,
        parent_id: newComment.parent_id,
        isReply: !!newComment.parent_id,
      });

      if (newComment.post_id === post.id) {
        setCurrentPost((prev) => {
          if (newComment.parent_id) {
            console.log(
              "Processing as reply to comment:",
              newComment.parent_id
            );
            return {
              ...prev,
              comments: prev.comments?.map((comment) => {
                if (comment.id === newComment.parent_id) {
                  console.log("Found parent comment, adding reply");
                  return {
                    ...comment,
                    replies: [
                      ...(comment.replies || []),
                      {
                        id: newComment.id,
                        content: newComment.content,
                        user_id: newComment.user_id,
                        created_at: newComment.created_at,
                        likes: newComment.likes,
                      },
                    ],
                  };
                }
                return comment;
              }),
            };
          }
          console.log("Processing as top-level comment");
          return {
            ...prev,
            comments: [
              ...(prev.comments || []),
              { ...newComment, replies: [] },
            ],
          };
        });
        setCommentCount((prev) => prev + 1);
      }
    });

    // Listen for comment like updates
    socket.on("comment_like_update", ({ commentId, likesCount, liked }) => {
      setCurrentPost((prev) => ({
        ...prev,
        comments: prev.comments?.map((comment) =>
          comment.id === commentId
            ? { ...comment, likes: likesCount, liked }
            : comment
        ),
      }));
    });

    return () => {
      socket.off("new_comment");
      socket.off("comment_like_update");
    };
  }, [socket, post.id]);

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
    if (!newComment.trim() || !user) return;

    console.log("Adding new top-level comment:", {
      content: newComment.trim(),
      parent_id: null,
    });

    socket.emit("create_comment", {
      postId: post.id,
      userId: user.id,
      content: newComment.trim(),
    });

    setNewComment("");
    Keyboard.dismiss();
  };

  // Replace showComments state with this function
  const handleShowComments = () => {
    commentsSheetRef.current?.present();
  };

  // Add handleLikeComment function
  const handleLikeComment = (commentId: string, isLiked: boolean) => {
    if (!user) return;

    socket.emit("like_comment", {
      commentId,
      userId: user.id,
      liked: !isLiked,
    });
  };

  // Add handleReplyToComment function
  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId);
  };

  // Add handleCancelReply
  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent("");
  };

  const handleSubmitReply = (commentId: string) => {
    if (!replyContent.trim() || !user) return;

    console.log("Submitting reply:", {
      parentCommentId: commentId,
      content: replyContent.trim(),
    });

    socket.emit("create_comment", {
      postId: post.id,
      userId: user.id,
      content: replyContent.trim(),
      parent_id: commentId, // This makes it a reply instead of a top-level comment
    });

    setReplyContent("");
    setReplyingTo(null);
    Keyboard.dismiss();
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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
              onPress={handleShowComments}
            >
              <Icon name="comment-outline" size={20} color="#7C4DFF" />
              <Text style={styles.footerText}>{commentCount}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BottomSheetModal
          ref={commentsSheetRef}
          snapPoints={["90%"]}
          enablePanDownToClose
          index={0}
          android_keyboardInputMode="adjustResize"
          style={styles.bottomSheet}
          handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.3)" }}
          backgroundStyle={{ backgroundColor: "#121212" }}
          topInset={Platform.OS === "ios" ? 47 : 0}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="none"
        >
          <View style={{ flex: 1 }}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
              keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
            >
              <BottomSheetScrollView
                style={{
                  flex: 1,
                  marginBottom: Platform.OS === "ios" ? 40 : 0,
                }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: Platform.OS === "ios" ? 90 : 120,
                  paddingTop: 8,
                }}
                showsVerticalScrollIndicator={true}
                bounces={false}
                keyboardDismissMode="interactive"
                keyboardShouldPersistTaps="handled"
              >
                {currentPost.comments?.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <RandomAvatar seed={comment.user_id} size={32} />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>Anonymous</Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                      <View style={styles.commentActions}>
                        <View style={styles.actionGroup}>
                          <Text style={styles.commentTime}>
                            {formatTimeAgo(comment.created_at)}
                          </Text>
                          <TouchableOpacity
                            style={styles.replyButton}
                            onPress={() => handleReplyToComment(comment.id)}
                          >
                            <Icon name="reply" size={14} color="#7C4DFF" />
                            <Text style={styles.replyText}>Reply</Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Show replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <>
                          <TouchableOpacity
                            style={styles.showRepliesButton}
                            onPress={() => toggleReplies(comment.id)}
                          >
                            <Icon
                              name={
                                expandedReplies.has(comment.id)
                                  ? "chevron-up"
                                  : "chevron-down"
                              }
                              size={16}
                              color="#7C4DFF"
                            />
                            <Text style={styles.showRepliesText}>
                              {expandedReplies.has(comment.id)
                                ? "Hide Replies"
                                : `Show ${comment.replies.length} ${
                                    comment.replies.length === 1
                                      ? "Reply"
                                      : "Replies"
                                  }`}
                            </Text>
                          </TouchableOpacity>

                          {expandedReplies.has(comment.id) && (
                            <View style={styles.repliesContainer}>
                              {comment.replies.map((reply) => (
                                <View key={reply.id} style={styles.replyItem}>
                                  <RandomAvatar
                                    seed={reply.user_id}
                                    size={24}
                                  />
                                  <View style={styles.replyContent}>
                                    <Text style={styles.replyUsername}>
                                      Anonymous
                                    </Text>
                                    <Text style={styles.replyText}>
                                      {reply.content}
                                    </Text>
                                    <Text style={styles.replyTime}>
                                      {formatTimeAgo(reply.created_at)}
                                    </Text>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
                        </>
                      )}

                      {/* Reply input */}
                      {replyingTo === comment.id && (
                        <View style={styles.replyInputContainer}>
                          <RandomAvatar
                            seed={user?.id || "default"}
                            size={24}
                          />
                          <TextInput
                            style={styles.replyInput}
                            placeholder="Write a reply..."
                            placeholderTextColor="#666"
                            value={replyContent}
                            onChangeText={setReplyContent}
                            multiline
                            autoFocus
                          />
                          <View style={styles.replyActions}>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={() => {
                                handleCancelReply();
                                setReplyContent("");
                              }}
                            >
                              <Text style={styles.cancelButtonText}>
                                Cancel
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.replySubmitButton,
                                !replyContent.trim() &&
                                  styles.replySubmitButtonDisabled,
                              ]}
                              onPress={() => {
                                handleSubmitReply(comment.id);
                                setReplyContent("");
                              }}
                              disabled={!replyContent.trim()}
                            >
                              <Text style={styles.replySubmitButtonText}>
                                Reply
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </BottomSheetScrollView>

              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "height" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
              >
                <View
                  style={[
                    styles.addCommentContainer,
                    styles.fixedInputContainer,
                    {
                      paddingBottom: Platform.OS === "ios" ? 40 : 16,
                      marginBottom: Platform.OS === "ios" ? 40 : 0,
                    },
                  ]}
                >
                  <RandomAvatar seed={user?.id || "default"} size={32} />
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
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
                    onPress={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    <LinearGradient
                      colors={["#7C4DFF", "#FF4D9C"]}
                      style={styles.sendButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Icon name="send" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </KeyboardAvoidingView>
          </View>
        </BottomSheetModal>
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
  commentsContainer: {
    flex: 1,
    backgroundColor: "#121212",
  },
  commentsScrollView: {
    flex: 1,
  },
  commentsList: {
    marginTop: 16,
    gap: 16,
  },
  commentItem: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 30,
  },
  commentContent: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 16,
  },
  commentUsername: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 14,
    marginBottom: 4,
  },
  commentText: {
    color: "#FFFFFF",
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  commentTime: {
    color: "#666",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  likeCommentButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  commentLikes: {
    color: "#7C4DFF",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    // paddingBottom: Platform.OS === "ios" ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1E1E1E",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: "#FFFFFF",
    maxHeight: 100,
    fontFamily: fonts.regular,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  commentsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#121212",
  },
  commentsTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  fixedInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
  },
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyText: {
    color: "#7C4DFF",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  repliesContainer: {
    marginTop: 12,
    paddingLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(255,255,255,0.1)",
  },
  replyItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  replyContent: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 8,
    borderRadius: 12,
  },
  replyUsername: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  replyTime: {
    color: "#666",
    fontSize: 10,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  replyingToContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
    width: "100%",
    position: "absolute",
    top: -40,
    left: 0,
    backgroundColor: "#1E1E1E",
  },
  replyingToText: {
    color: "#666",
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  replyInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    flexDirection: "column",
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#FFFFFF",
    fontFamily: fonts.regular,
    marginLeft: 32,
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginLeft: 32,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    color: "#666",
    fontFamily: fonts.regular,
    fontSize: 14,
  },
  replySubmitButton: {
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  replySubmitButtonDisabled: {
    opacity: 0.5,
  },
  replySubmitButtonText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
    fontSize: 14,
  },
  bottomSheet: {
    flex: 1,
  },
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  showRepliesText: {
    color: "#7C4DFF",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
});
