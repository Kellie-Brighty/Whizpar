import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  Text,
  TextInput,
  Modal,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Post } from "../../components/posts/Post";
import { usePost } from "../../context/PostContext";
import { Surface } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { fetchFeeds } from "../../api/feedApi"; // Assume you have an API function to fetch feeds

// Updated mock data with real images
const MOCK_POSTS = [
  {
    id: "1",
    username: "Anonymous",
    content: "Sometimes I feel like I'm not good enough...",
    createdAt: "2 mins ago",
    type: "text" as const,
    likes: 234,
    comments: [
      {
        id: "c1",
        username: "Anonymous",
        content: "Stay strong! We're all in this together.",
        createdAt: "1 min ago",
        likes: 5,
        replies: [
          {
            id: "r1",
            username: "Anonymous",
            content: "Thank you for the kind words! 🙏",
            createdAt: "30s ago",
            likes: 2,
            replies: [],
          },
        ],
      },
      {
        id: "c2",
        username: "Anonymous",
        content:
          "I've been there. It gets better with time. Focus on small wins and celebrate them.",
        createdAt: "2 min ago",
        likes: 8,
        replies: [],
      },
      {
        id: "c3",
        username: "Anonymous",
        content:
          "Remember that your worth isn't measured by your productivity or achievements.",
        createdAt: "3 min ago",
        likes: 12,
        replies: [],
      },
      {
        id: "c4",
        username: "Anonymous",
        content: "Sending virtual hugs 🫂",
        createdAt: "4 min ago",
        likes: 7,
        replies: [],
      },
      {
        id: "c5",
        username: "Anonymous",
        content:
          "Take it one day at a time. You're doing better than you think.",
        createdAt: "5 min ago",
        likes: 15,
        replies: [],
      },
    ],
  },
  {
    id: "2",
    username: "Anonymous",
    content: "Found this beautiful spot today...",
    createdAt: "15 mins ago",
    type: "image" as const,
    imageUrl:
      "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop",
    likes: 856,
    comments: [],
  },
  {
    id: "3",
    username: "Anonymous",
    content:
      "Just needed to get this off my chest: University is overwhelming and it's okay to take breaks. Mental health comes first. 🧠❤️",
    createdAt: "1 hour ago",
    type: "text" as const,
    likes: 1431,
    comments: [],
  },
];

declare module "react-native-vector-icons/MaterialCommunityIcons";

type FeedItem = {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  type: "text" | "image";
  likes: number;
  comments: Array<{
    id: string;
    username: string;
    content: string;
    createdAt: string;
    likes: number;
    replies: Array<{
      id: string;
      username: string;
      content: string;
      createdAt: string;
      likes: number;
      replies: never[];
    }>;
  }>;
  imageUrl?: string;
};

export const FeedScreen = () => {
  const { state, dispatch } = usePost();
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState<{
    content: string;
    image: string | null;
  }>({ content: "", image: null });
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      dispatch({ type: "SET_POSTS", payload: MOCK_POSTS });
      setRefreshing(false);
    }, 1500);
  }, []);

  const createPost = () => {
    // Add post creation logic here
    setIsCreating(false);
    setNewPost({ content: "", image: null });
  };

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to upload images.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setNewPost((prev) => ({
          ...prev,
          image: result.assets[0].uri,
        }));
      }
    } catch (error) {
      alert("Error picking image");
      console.error(error);
    }
  };

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const data = await fetchFeeds();
        setFeeds(
          data
            .filter((feed) => feed.type === "text" || feed.type === "image")
            .map((feed) => ({
              ...feed,
              type: feed.type as "image" | "text",
            }))
        );
      } catch (error) {
        console.error("Error loading feeds:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFeeds();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />
      <View style={styles.headerContainer}>
        <Surface style={styles.headerContent}>
          <Text style={styles.headerTitle}>Whizpar</Text>
          <TouchableOpacity
            onPress={() => setIsCreating(true)}
            style={styles.createButton}
          >
            <View style={styles.createIconContainer}>
              <Icon name="ghost-outline" size={22} color="#7C4DFF" />
              <Icon
                name="plus-circle-outline"
                size={14}
                color="#7C4DFF"
                style={styles.plusIcon}
              />
            </View>
          </TouchableOpacity>
        </Surface>
      </View>

      <Modal
        visible={isCreating}
        animationType="slide"
        transparent
        onRequestClose={() => setIsCreating(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <View style={styles.modalContainer}>
              <Surface style={styles.createPostContainer}>
                <View style={styles.createHeader}>
                  <Text style={styles.createTitle}>New Post</Text>
                  <TouchableOpacity onPress={() => setIsCreating(false)}>
                    <Icon name="close" size={24} color="#6B6B6B" />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="What's on your mind?"
                  placeholderTextColor="#6B6B6B"
                  multiline
                  value={newPost.content}
                  onChangeText={(text) =>
                    setNewPost((prev) => ({ ...prev, content: text }))
                  }
                />

                {newPost.image && (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: newPost.image }}
                      style={styles.previewImage}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() =>
                        setNewPost((prev) => ({ ...prev, image: null }))
                      }
                    >
                      <Icon name="close-circle" size={24} color="#FF4081" />
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <Icon name="image-plus" size={24} color="#7C4DFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.postButton,
                      !newPost.content && styles.postButtonDisabled,
                    ]}
                    onPress={createPost}
                    disabled={!newPost.content}
                  >
                    <Text style={styles.postButtonText}>Post</Text>
                  </TouchableOpacity>
                </View>
              </Surface>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={feeds}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#ccc"
            colors={["#ccc"]}
          />
        }
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  headerContainer: {
    backgroundColor: "#1E1E1E",
    elevation: 2,
    zIndex: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#1E1E1E",
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
  listContainer: {
    paddingTop: 8,
    paddingBottom: 100,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  createPostContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    elevation: 5,
  },
  createHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  createTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  input: {
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
    padding: 4,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  imageButton: {
    padding: 8,
  },
  postButton: {
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  postButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  createButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2A2A2A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    borderWidth: 1,
    borderColor: "#3A3A3A",
  },
  createIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: "#2A2A2A",
    borderRadius: 7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
