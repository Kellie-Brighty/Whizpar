
import React, {
  useCallback,
  useMemo,
  useState,
  forwardRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import {
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { RandomAvatar } from "../RandomAvatar";
import { fonts } from "../../theme/fonts";
import { postService, Comment as CommentType } from "../../services/postService";
import { CommentItem } from "../comments/CommentItem";

interface CommentsSheetProps {
  postId: string;
  comments: CommentType[];
  user: any;
  onCommentAdded: (comment: CommentType) => void;
  onCommentLiked?: (commentId: string) => void;
  onReplyAdded?: (parentId: string, reply: any) => void;
}

export const CommentsSheet = forwardRef<BottomSheetModal, CommentsSheetProps>(
  ({ postId, comments, user, onCommentAdded, onCommentLiked, onReplyAdded }, ref) => {
    const [newComment, setNewComment] = useState("");
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const inputRef = React.useRef<TextInput>(null);

    const snapPoints = useMemo(() => ["100%"], []);

    const handleAddComment = async () => {
      if (!newComment.trim() || !user || isPostingComment) return;

      try {
        setIsPostingComment(true);
        const { comment, error } = await postService.createComment(
          postId,
          user.uid,
          newComment.trim()
        );

        if (comment) {
          const commentWithReplies = { ...comment, replies: [] };
          onCommentAdded(commentWithReplies);
          setNewComment("");
          inputRef.current?.clear();
          Keyboard.dismiss();
        }
      } catch (error) {
        console.error("Error adding comment:", error);
      } finally {
        setIsPostingComment(false);
      }
    };

    const handleReplyPress = useCallback((commentId: string) => {
      setReplyingTo(commentId);
    }, []);

    const handleCancelReply = useCallback(() => {
      setReplyingTo(null);
    }, []);

    const handleSubmitReply = useCallback(async (commentId: string, content: string) => {
      if (!content.trim() || !user) return;

      try {
        const { comment, error } = await postService.createComment(
          postId,
          user.uid,
          content.trim(),
          commentId
        );

        if (comment) {
          onReplyAdded?.(commentId, comment);
          setReplyingTo(null);
          Keyboard.dismiss();
        }
      } catch (error) {
        console.error("Error submitting reply:", error);
      }
    }, [postId, user, onReplyAdded]);

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
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
              {comments?.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  replyingTo={replyingTo}
                  onReplyPress={handleReplyPress}
                  onCancelReply={handleCancelReply}
                  onSubmitReply={handleSubmitReply}
                />
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
                <RandomAvatar seed={user?.uid || "default"} size={32} />
                <TextInput
                  ref={inputRef}
                  style={styles.commentInput}
                  placeholder="Write a comment..."
                  placeholderTextColor="#666"
                  defaultValue={newComment}
                  onChangeText={setNewComment}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!newComment.trim() || isPostingComment) &&
                      styles.sendButtonDisabled,
                  ]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim() || isPostingComment}
                >
                  <LinearGradient
                    colors={["#7C4DFF", "#FF4D9C"]}
                    style={styles.sendButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {isPostingComment ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Icon name="send" size={16} color="#FFFFFF" />
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </KeyboardAvoidingView>
        </View>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  bottomSheet: {
    flex: 1,
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
  addCommentContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "#1E1E1E",
  },
  fixedInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
});
