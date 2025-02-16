import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Surface } from 'react-native-paper';

interface CommentType {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: CommentType[];
}

interface CommentProps {
  comment: CommentType;
  level?: number;
}

export const Comment: React.FC<CommentProps> = ({ comment, level = 0 }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const maxLevel = 3; // Maximum nesting level

  const handleReply = () => {
    // Add reply logic here
    setReplyText('');
    setIsReplying(false);
  };

  return (
    <View style={[styles.container, { marginLeft: level * 12 }]}>
      <Surface style={styles.commentContent}>
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Icon name="incognito" size={16} color="#7C4DFF" />
            </View>
            <Text style={styles.username}>{comment.username}</Text>
            <Text style={styles.time}>{comment.createdAt}</Text>
          </View>
          <TouchableOpacity>
            <Icon name="dots-vertical" size={16} color="#6B6B6B" />
          </TouchableOpacity>
        </View>

        <Text style={styles.text}>{comment.content}</Text>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="heart-outline" size={16} color="#7C4DFF" />
            <Text style={styles.actionText}>{comment.likes}</Text>
          </TouchableOpacity>
          {level < maxLevel && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setIsReplying(true)}
            >
              <Icon name="reply" size={16} color="#7C4DFF" />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>

        {isReplying && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              placeholderTextColor="#6B6B6B"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <View style={styles.replyActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsReplying(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.replyButton, !replyText && styles.replyButtonDisabled]}
                onPress={handleReply}
                disabled={!replyText}
              >
                <Text style={styles.replyButtonText}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {comment.replies?.length > 0 && (
          <>
            <TouchableOpacity
              style={styles.showRepliesButton}
              onPress={() => setShowReplies(!showReplies)}
            >
              <Icon
                name={showReplies ? "chevron-up" : "chevron-down"}
                size={20}
                color="#7C4DFF"
              />
              <Text style={styles.showRepliesText}>
                {showReplies ? "Hide replies" : `Show ${comment.replies.length} replies`}
              </Text>
            </TouchableOpacity>

            {showReplies && (
              <View style={styles.replies}>
                {comment.replies.map((reply) => (
                  <Comment
                    key={reply.id}
                    comment={reply}
                    level={level + 1}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </Surface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  commentContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 10,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  time: {
    color: '#6B6B6B',
    fontSize: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    color: '#7C4DFF',
    fontSize: 12,
    marginLeft: 4,
  },
  replyContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingTop: 8,
  },
  replyInput: {
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 40,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelButton: {
    marginRight: 12,
    padding: 6,
  },
  cancelText: {
    color: '#6B6B6B',
    fontSize: 14,
  },
  replyButton: {
    backgroundColor: '#7C4DFF',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  replyButtonDisabled: {
    backgroundColor: '#4A4A4A',
  },
  replyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  showRepliesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 4,
  },
  showRepliesText: {
    color: '#7C4DFF',
    fontSize: 14,
    marginLeft: 4,
  },
  replies: {
    marginTop: 8,
  },
}); 