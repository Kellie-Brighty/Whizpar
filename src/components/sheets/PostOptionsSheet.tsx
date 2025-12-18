import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetTextInput } from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fonts } from "../../theme/fonts";
import { Post, postService } from "../../services/postService";
import Toast from "react-native-toast-message";

interface PostOptionsSheetProps {
  post: Post;
  currentUserId?: string;
  onEditSuccess: (newContent: string) => void;
  onDeleteSuccess?: () => void; // Optional if we wanted delete, but owner only edits
}

export const PostOptionsSheet = React.forwardRef<BottomSheetModal, PostOptionsSheetProps>(
  ({ post, currentUserId, onEditSuccess }, ref) => {
    const snapPoints = useMemo(() => ["40%", "80%"], []);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(post.content);

    const isOwner = currentUserId === post.user_id;

    const handleEdit = async () => {
      if (!editContent.trim()) return;

      const { success, error } = await postService.editPost(post.id, editContent);
      if (success) {
        onEditSuccess(editContent);
        setIsEditing(false);
        (ref as any).current?.dismiss();
        Toast.show({ type: "success", text1: "Whizpar updated" });
      } else {
        Toast.show({ type: "error", text1: "Failed to update" });
      }
    };

    const handleReport = async () => {
      if (!currentUserId) return;
      
      const { deleted, alreadyReported, error } = await postService.reportPost(post.id, currentUserId);
      
      if (alreadyReported) {
         Toast.show({ type: "info", text1: "You have already reported this post" });
         (ref as any).current?.dismiss();
         return;
      }

      if (error) {
        Toast.show({ type: "error", text1: "Failed to report" });
        return;
      }
      
      if (deleted) {
        Toast.show({ type: "info", text1: "Post removed due to reports" });
      } else {
        Toast.show({ type: "success", text1: "Post reported", text2: "Thank you for keeping the community safe." });
      }
      (ref as any).current?.dismiss();
    };

    const renderContent = () => {
      if (isEditing) {
        return (
          <View style={styles.content}>
            <Text style={styles.title}>Edit Whizpar</Text>
            <BottomSheetTextInput
              style={styles.input}
              value={editContent}
              onChangeText={setEditContent}
              multiline
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setIsEditing(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleEdit}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.content}>
          <Text style={styles.headerTitle}>Options</Text>
          {isOwner ? (
            <TouchableOpacity
              style={styles.optionItem}
              onPress={() => {
                setEditContent(post.content);
                setIsEditing(true);
              }}
            >
              <View style={styles.iconContainer}>
                <Icon name="pencil" size={24} color="#FFFFFF" />
              </View>
              <Text style={styles.optionText}>Edit Whizpar</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.optionItem} onPress={handleReport}>
              <View style={[styles.iconContainer, styles.reportIcon]}>
                <Icon name="alert-circle" size={24} color="#FF4D4D" />
              </View>
              <Text style={[styles.optionText, styles.reportText]}>
                Report Whizpar
              </Text>
            </TouchableOpacity>
          )}
        </View>
      );
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: "#1E1E1E" }}
        handleIndicatorStyle={{ backgroundColor: "#FFFFFF" }}
      >
        <BottomSheetView style={styles.container}>
          {renderContent()}
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  content: {
    gap: 20,
  },
  headerTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 10,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    gap: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  reportIcon: {
    backgroundColor: "rgba(255, 77, 77, 0.1)",
  },
  optionText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: "#FFFFFF",
  },
  reportText: {
    color: "#FF4D4D",
  },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontFamily: fonts.regular,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  saveButton: {
    backgroundColor: "#7C4DFF",
  },
  cancelText: {
    color: "#FFFFFF",
    fontFamily: fonts.semiBold,
  },
  saveText: {
    color: "#FFFFFF",
    fontFamily: fonts.bold,
  },
});
