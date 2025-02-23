import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
  ViewToken,
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
import { fonts } from "../../theme/fonts";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AvatarPickerSheet } from "../../components/sheets/AvatarPickerSheet";
import { CreatePostSheet } from "../../components/sheets/CreatePostSheet";
import { LoadingOverlay } from "../../components/common/LoadingOverlay";
import { postService, Post as PostType } from "../../services/postService";
import { useAuth } from "../../contexts/AuthContext";
import Toast from "react-native-toast-message";
import { supabase } from "../../lib/supabase";

import { createSocket } from "../../lib/socket";

// Updated mock data with real images
// const MOCK_POSTS: PostType[] = [
//   {
//     id: "1",
//     username: "Anonymous",
//     content: "Sometimes I feel like I'm not good enough...",
//     createdAt: "2 mins ago",
//     type: "text" as const,
//     likes: 234,
//     comments: [
//       {
//         id: "c1",
//         username: "Anonymous",
//         content: "Stay strong! We're all in this together.",
//         createdAt: "1 min ago",
//         likes: 5,
//         replies: [
//           {
//             id: "r1",
//             username: "Anonymous",
//             content: "Thank you for the kind words! 🙏",
//             createdAt: "30s ago",
//             likes: 2,
//             replies: [],
//           },
//         ],
//       },
//       {
//         id: "c2",
//         username: "Anonymous",
//         content:
//           "I've been there. It gets better with time. Focus on small wins and celebrate them.",
//         createdAt: "2 min ago",
//         likes: 8,
//         replies: [],
//       },
//       {
//         id: "c3",
//         username: "Anonymous",
//         content:
//           "Remember that your worth isn't measured by your productivity or achievements.",
//         createdAt: "3 min ago",
//         likes: 12,
//         replies: [],
//       },
//       {
//         id: "c4",
//         username: "Anonymous",
//         content: "Sending virtual hugs 🫂",
//         createdAt: "4 min ago",
//         likes: 7,
//         replies: [],
//       },
//       {
//         id: "c5",
//         username: "Anonymous",
//         content:
//           "Take it one day at a time. You're doing better than you think.",
//         createdAt: "5 min ago",
//         likes: 15,
//         replies: [],
//       },
//     ],
//   },
//   {
//     id: "2",
//     username: "Anonymous",
//     content: "Found this beautiful spot today...",
//     createdAt: "15 mins ago",
//     type: "image" as const,
//     imageUrl:
//       "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop",
//     likes: 856,
//     comments: [],
//   },
//   {
//     id: "3",
//     username: "Anonymous",
//     content:
//       "Just needed to get this off my chest: University is overwhelming and it's okay to take breaks. Mental health comes first. 🧠❤️",
//     createdAt: "1 hour ago",
//     type: "text" as const,
//     likes: 1431,
//     comments: [],
//   },
// ];

declare module "react-native-vector-icons/MaterialCommunityIcons";

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
const AnimatedPost = ({
  item,
  index,
  isViewable,
}: {
  item: PostType;
  index: number;
  isViewable?: boolean;
}) => {
  const scale = useSharedValue(1);
  const likeScale = useSharedValue(1);
  const { user } = useAuth();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const likeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));

  const handleLike = () => {
    likeScale.value = withSequence(
      withSpring(1.2),
      withDelay(100, withSpring(1))
    );
  };

  return (
    <Animated.View
      entering={SlideInRight.delay(index * 100)}
      style={[styles.postContainer, animatedStyle]}
    >
      <Post
        post={item}
        user={user}
        onPressIn={() => {
          scale.value = withSpring(0.98);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        onLike={handleLike}
        likeAnimatedStyle={likeAnimatedStyle}
        onViewableItemsChanged={isViewable}
      />
    </Animated.View>
  );
};

type PostLikePayload = {
  post_id: string;
  user_id: string;
};

type PostPayload = {
  id: string;
  content: string;
  user_id: string;
};

type RealtimePayload = {
  new: PostLikePayload | null;
  old: PostLikePayload | null;
};

export const FeedScreen = () => {
  const { state, dispatch } = usePost();
  const [refreshing, setRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newPost, setNewPost] = useState<{
    content: string;
    image: string | null;
  }>({ content: "", image: null });
  const [feeds, setFeeds] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"trending" | "latest">("trending");
  const scale = useSharedValue(1);
  const createPostRef = useRef<BottomSheetModal>(null);
  const { user } = useAuth();
  const socket = useMemo(() => createSocket(user?.id), [user?.id]);

  const loadFeeds = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { posts, error } = await postService.getPosts(activeTab);
      if (error) throw error;
      if (posts) {
        setFeeds(posts);
      }
    } catch (error) {
      console.error("Error loading feeds:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeds();

    // Listen for new posts
    socket.on("new_post", (newPost: PostType) => {
      setFeeds((prev) => [newPost, ...prev]);
    });

    // Listen for like updates
    socket.on(
      "like_update",
      ({ postId, likesCount }: { postId: string; likesCount: number }) => {
        setFeeds((prev) =>
          prev.map((feed) =>
            feed.id === postId ? { ...feed, likes: likesCount } : feed
          )
        );
      }
    );

    return () => {
      socket.off("new_post");
      socket.off("like_update");
    };
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFeeds();
    setRefreshing(false);
  };

  const createPost = async (content: string, image?: string) => {
    if (!user) return;

    try {
      // Emit create_post event to socket server
      socket.emit("create_post", {
        content,
        userId: user.id,
        image,
      });

      Toast.show({
        type: "success",
        text1: "Post created successfully",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      Toast.show({
        type: "error",
        text1: "Failed to create post",
      });
    }
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

  const tabs = [
    { id: "trending", icon: "trending-up", label: "Trending" },
    { id: "latest", icon: "clock-outline", label: "Latest" },
    // { id: "following", icon: "account-group", label: "Following" },
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

  // Add this component for empty state
  const EmptyFeed = () => (
    <View style={styles.emptyContainer}>
      <Icon name="post-outline" size={64} color="#666" />
      <Text style={styles.emptyText}>No whispers yet</Text>
      <Text style={styles.emptySubtext}>
        Be the first to share your thoughts
      </Text>
    </View>
  );

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((viewableItem) => {
        if (viewableItem.isViewable && viewableItem.item?.id) {
          const post = viewableItem.item as PostType;
          setFeeds((prev) =>
            prev.map((item) =>
              item.id === post.id ? { ...item, isViewable: true } : item
            )
          );
        }
      });
    },
    []
  );

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 1000,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <StatusBar backgroundColor="#121212" barStyle="light-content" />

      <CreatePostSheet ref={createPostRef} onPost={createPost} />

      <BlurView intensity={20} style={styles.header}>
        <Surface style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Whispers</Text>
            <Text style={styles.subtitle}>Share your thoughts</Text>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => createPostRef.current?.present()}
          >
            <LinearGradient
              colors={["#7C4DFF", "#FF4D9C"]}
              style={styles.createButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Animated.View
                entering={FadeIn.duration(500)}
                style={styles.createIconContainer}
              >
                <Icon name="pencil-plus" size={24} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </Surface>
        <View style={styles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.activeTab]}
              onPress={() => setActiveTab(tab.id as "trending" | "latest")}
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
        contentContainerStyle={[
          styles.listContainer,
          { paddingBottom: Platform.OS === "ios" ? 120 : 100 }, // Increase bottom padding on iOS
        ]}
        data={feeds}
        renderItem={({ item, index }) => (
          <AnimatedPost
            item={item}
            index={index}
            isViewable={item.isViewable || false}
          />
        )}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading || refreshing}
            onRefresh={onRefresh}
            tintColor="#7C4DFF"
            colors={["#7C4DFF"]}
          />
        }
        ListEmptyComponent={!loading ? EmptyFeed : null}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
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
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    fontSize: 18,
  },
  input: {
    fontFamily: fonts.regular,
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
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
  },
  createButton: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    transform: [{ scale: 1.1 }],
  },
  createButtonGradient: {
    padding: 12,
    borderRadius: 12,
  },
  createIconContainer: {
    alignItems: "center",
    justifyContent: "center",
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
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
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "#6B6B6B",
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
    fontFamily: fonts.regular,
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
    fontFamily: fonts.semiBold,
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
    fontFamily: fonts.bold,
    color: "#FFD700",
    fontSize: 12,
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
    fontFamily: fonts.regular,
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
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: fonts.regular,
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
  },
});
