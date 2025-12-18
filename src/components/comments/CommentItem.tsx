import React, { memo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { RandomAvatar } from "../RandomAvatar";
import { fonts } from "../../theme/fonts";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { Comment as CommentType } from "../../services/postService";

interface CommentItemProps {
  comment: CommentType;
  user: any;
  replyingTo: string | null;
  onReplyPress: (commentId: string) => void;
  onCancelReply: () => void;
  onSubmitReply: (commentId: string, content: string) => void;
}

export const CommentItem = memo(({
  comment,
  user,
  replyingTo,
  onReplyPress,
  onCancelReply,
  onSubmitReply
}: CommentItemProps) => {
  const [expandedReplies, setExpandedReplies] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const inputRef = React.useRef<TextInput>(null);

  const handleReplySubmit = () => {
    if (replyContent.trim()) {
      onSubmitReply(comment.id, replyContent);
      setReplyContent("");
      inputRef.current?.clear();
    }
  };

  const isReplying = replyingTo === comment.id;

  return (
    <View style={styles.commentItem}>
      <RandomAvatar seed={comment.id} size={32} />
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
              onPress={() => onReplyPress(comment.id)}
            >
              <Icon name="reply" size={14} color="rgba(255, 255, 255, 0.6)" />
              <Text style={styles.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Show replies */}
        {comment.replies && comment.replies.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.showRepliesButton}
              onPress={() => setExpandedReplies(!expandedReplies)}
            >
              <Icon
                name={expandedReplies ? "chevron-up" : "chevron-down"}
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
              <Text style={styles.showRepliesText}>
                {expandedReplies
                  ? "Hide Replies"
                  : `Show ${comment.replies.length} ${
                      comment.replies.length === 1 ? "Reply" : "Replies"
                    }`}
              </Text>
            </TouchableOpacity>

            {expandedReplies && (
              <View style={styles.repliesContainer}>
                {comment.replies.map((reply) => (
                  <View key={reply.id} style={styles.replyItem}>
                    <RandomAvatar seed={reply.id} size={24} />
                    <View style={styles.replyContent}>
                      <Text style={styles.replyUsername}>Anonymous</Text>
                      <Text style={styles.replyText}>{reply.content}</Text>
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
        {isReplying && (
          <View style={styles.replyInputContainer}>
            <View style={styles.incognitoIcon}>
              <Icon name="incognito" size={16} color="rgba(255,255,255,0.5)" />
            </View>
            <TextInput
              ref={inputRef}
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor="#666"
              defaultValue={replyContent}
              onChangeText={setReplyContent}
              multiline
              autoFocus
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  onCancelReply();
                  setReplyContent("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.replySubmitButton,
                  !replyContent.trim() && styles.replySubmitButtonDisabled,
                ]}
                onPress={handleReplySubmit}
                disabled={!replyContent.trim()}
              >
                <Text style={styles.replySubmitButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
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
  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commentTime: {
    color: "#666",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  replyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  showRepliesText: {
    color: "rgba(255, 255, 255, 0.6)",
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
  replyInputContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
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
  },
  incognitoIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  replyActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
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
});
