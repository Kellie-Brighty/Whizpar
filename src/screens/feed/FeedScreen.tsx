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
  ActivityIndicator,
  FlatList,
  Dimensions,
} from "react-native";
import { Post } from "../../components/posts/Post";
import { usePost } from "../../context/PostContext";
import { Surface } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { fetchFeeds } from "../../api/feedApi"; // Assume you have an API function to fetch feeds
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  useSharedValue,
  withSequence,
  withDelay,
  FadeIn,
  SlideInRight,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

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

const { width } = Dimensions.get("window");

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Add this interface near other type definitions
interface Whisper {
  id: string;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  impact: number;
}

// Create a new WhisperCard component
const WhisperCard = ({ item }: { item: Whisper }) => {
  const cardScale = useSharedValue(1);
  const likeScale = useSharedValue(1);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[styles.whisperCard, cardAnimatedStyle]}
      onPressIn={() => {
        cardScale.value = withSpring(0.98);
      }}
      onPressOut={() => {
        cardScale.value = withSpring(1);
      }}
    >
      <LinearGradient
        colors={["rgba(124, 77, 255, 0.1)", "rgba(30, 30, 30, 0.95)"]}
        style={styles.cardGradient}
      >
        <Text style={styles.whisperContent}>{item.content}</Text>

        <View style={styles.whisperFooter}>
          <View style={styles.whisperStats}>
            <TouchableOpacity
              style={styles.statButton}
              onPress={() => {
                likeScale.value = withSpring(1.2, {}, () => {
                  likeScale.value = withSpring(1);
                });
              }}
            >
              <Icon name="heart-outline" size={20} color="#7C4DFF" />
              <Text style={styles.statText}>{item.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.statButton}>
              <Icon name="comment-outline" size={20} color="#7C4DFF" />
              <Text style={styles.statText}>{item.comments}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.impactContainer}>
            <Icon name="lightning-bolt" size={16} color="#FFD700" />
            <Text style={styles.impactText}>{item.impact}</Text>
          </View>
        </View>

        <View style={styles.timeContainer}>
          <Icon name="clock-outline" size={12} color="#6B6B6B" />
          <Text style={styles.timeText}>{item.timeAgo}</Text>
        </View>
      </LinearGradient>
    </AnimatedTouchable>
  );
};

// Create an enhanced Post component with animations
const AnimatedPost = ({ item, index }: { item: FeedItem; index: number }) => {
  const scale = useSharedValue(1);
  const likeScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100)}
      style={[styles.postContainer, animatedStyle]}
    >
      <Post
        post={item}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onLike={() => {
          likeScale.value = withSequence(
            withSpring(1.2),
            withDelay(100, withSpring(1))
          );
        }}
        likeAnimatedStyle={likeAnimatedStyle}
      />
    </Animated.View>
  );
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
  const [activeTab, setActiveTab] = useState("trending");
  const scale = useSharedValue(1);

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

  const tabs = [
    { id: "trending", icon: "trending-up", label: "Trending" },
    { id: "latest", icon: "clock-outline", label: "Latest" },
    { id: "following", icon: "account-group", label: "Following" },
  ];

  const whispers = [
    {
      id: "1",
      content: "Thoughts become whispers, whispers become changes...",
      likes: 42,
      comments: 8,
      timeAgo: "2h",
      impact: 89,
    },
    // Add more whispers...
  ];

  const renderWhisperCard = ({ item }: { item: Whisper }) => (
    <WhisperCard item={item} />
  );

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

      <Modal
        visible={isCreating}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setIsCreating(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsCreating(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.keyboardView}
              >
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
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BlurView intensity={20} style={styles.header}>
        <Surface style={styles.headerContent}>
          <Text style={styles.title}>Whispers</Text>
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
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Icon
                name={tab.icon}
                size={24}
                color={activeTab === tab.id ? "#7C4DFF" : "#6B6B6B"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.id && styles.activeTabLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BlurView>

      <Animated.FlatList
        contentContainerStyle={styles.listContainer}
        data={feeds}
        renderItem={({ item, index }) => (
          <AnimatedPost item={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#7C4DFF"
            colors={["#7C4DFF"]}
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
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 8,
    elevation: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "transparent",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: 20,
  },
  keyboardView: {
    width: "100%",
  },
  createPostContainer: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    elevation: 24,
    width: "100%",
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
    transform: [{ scale: 1.1 }],
    elevation: 8,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
  header: {
    padding: 16,
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    borderRadius: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
    borderRadius: 16,
  },
  activeTab: {
    backgroundColor: "rgba(124, 77, 255, 0.1)",
  },
  tabLabel: {
    color: "#6B6B6B",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabLabel: {
    color: "#7C4DFF",
  },
  whisperCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardGradient: {
    padding: 16,
  },
  whisperContent: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  whisperFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  whisperStats: {
    flexDirection: "row",
    gap: 16,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#7C4DFF",
    fontSize: 14,
  },
  impactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  impactText: {
    color: "#FFD700",
    fontSize: 12,
    fontWeight: "600",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    top: 16,
    right: 16,
    gap: 4,
  },
  timeText: {
    color: "#6B6B6B",
    fontSize: 12,
  },
  postContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E1E1E",
    elevation: 4,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});
