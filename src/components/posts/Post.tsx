import React, { useState } from "react";
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
import { PostType } from "../../types";
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

const { width } = Dimensions.get("window");

interface PostProps {
  post: PostType;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onLike?: () => void;
  likeAnimatedStyle?: { transform: { scale: number }[] };
}

export const Post: React.FC<PostProps> = ({
  post,
  onPressIn,
  onPressOut,
  onLike,
  likeAnimatedStyle,
}) => {
  const [liked, setLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const heartScale = useSharedValue(0);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

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
    <Surface style={styles.container}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.anonymousAvatar}>
            <Icon name="incognito" size={20} color="#7C4DFF" />
          </View>
          <Text style={styles.username}>{post.username}</Text>
        </View>
        <Text style={styles.time}>{post.createdAt}</Text>
      </View>

      {/* Post Content */}
      <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onDoubleTap}>
        <Animated.View
          style={[
            styles.contentContainer,
            post.type === "text" && styles.textOnlyContent,
          ]}
        >
          <Text
            style={[
              styles.content,
              post.type === "image" && { marginBottom: 12 },
            ]}
          >
            {post.content}
          </Text>
          {post.type === "image" && (
            <Image
              source={{ uri: post.imageUrl }}
              style={styles.contentImage}
              resizeMode="cover"
            />
          )}
          <Animated.View style={[styles.heartOverlay, heartStyle]}>
            <Icon name="heart" size={80} color="#7C4DFF" />
          </Animated.View>
        </Animated.View>
      </TapGestureHandler>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setLiked(!liked)}
          >
            <Icon
              name={liked ? "heart" : "heart-outline"}
              size={24}
              color={liked ? "#7C4DFF" : "#6B6B6B"}
            />
            <Text style={[styles.actionText, liked && styles.actionTextActive]}>
              {post.likes?.toLocaleString()}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Icon name="comment-outline" size={24} color="#7C4DFF" />
            <Text style={styles.actionText}>{post.comments.length}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showComments && (
        <View style={styles.commentsSection}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentTitle}>Comments</Text>
            <TouchableOpacity
              style={styles.addCommentButton}
              onPress={() => setIsAddingComment(true)}
            >
              <Icon name="plus" size={20} color="#7C4DFF" />
              <Text style={styles.addCommentText}>Add comment</Text>
            </TouchableOpacity>
          </View>

          {isAddingComment && (
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a comment..."
                placeholderTextColor="#6B6B6B"
                value={newComment}
                onChangeText={setNewComment}
                multiline
                autoFocus
              />
              <View style={styles.commentActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setIsAddingComment(false);
                    setNewComment("");
                  }}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    !newComment.trim() && styles.submitButtonDisabled,
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Text style={styles.submitButtonText}>Comment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <ScrollView
            style={styles.commentsScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {post.comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </ScrollView>
        </View>
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: "#1E1E1E",
    elevation: 4,
    overflow: "hidden",
    borderColor: "#2A2A2A",
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomColor: "#2A2A2A",
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#7C4DFF",
  },
  username: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 16,
    marginLeft: 8,
  },
  time: {
    fontFamily: fonts.regular,
    color: "#6B6B6B",
    fontSize: 12,
  },
  contentContainer: {
    padding: 16,
  },
  textOnlyContent: {
    backgroundColor: "#2A2A2A",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#363636",
  },
  content: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  contentImage: {
    width: "100%",
    height: 300,
    borderRadius: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopColor: "#2A2A2A",
    borderTopWidth: 1,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  actionText: {
    color: "#7C4DFF",
    marginLeft: 6,
    fontSize: 14,
  },
  actionTextActive: {
    color: "#FF4081",
  },
  heartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
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
    fontFamily: fonts.semiBold,
    color: "#7C4DFF",
    fontSize: 14,
  },
});
