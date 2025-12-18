import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
  SafeAreaView,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView as SafeAreaViewCompat } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  withTiming,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MainTabParamList, RootStackParamList } from "../../navigation/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RandomAvatar } from "../../components/RandomAvatar";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { fonts } from "../../theme/fonts";

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AvatarPickerSheet } from "../../components/sheets/AvatarPickerSheet";
import Toast from "react-native-toast-message";
import { CompositeNavigationProp } from "@react-navigation/native";
import { useAuth } from "../../contexts/AuthContext";
import { collection, query, where, orderBy, limit, getDocs, getDoc, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Post as PostType, postService } from "../../services/postService";
import { formatTimeAgo } from "../../utils/formatTimeAgo";
import { RecentWhispers } from "../../components/profile/RecentWhispers";

import { AllWhispersSheet } from "../../components/sheets/AllWhispersSheet";

const { width, height } = Dimensions.get("window");

const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = 80;
const AVATAR_MAX_SIZE = 80;
const AVATAR_MIN_SIZE = 40;
const AVATAR_SIZE = 100;
const AVATAR_MARGIN = 12;
const NUM_COLUMNS = 3;
const MODAL_PADDING = 24;
const MODAL_WIDTH = Math.min(
  width * 0.95,
  (AVATAR_SIZE + AVATAR_MARGIN * 2) * NUM_COLUMNS + MODAL_PADDING * 1
);

const WHIZPAR_ABOUT_URL = "https://whizpar.com/about";
const GRADIENT_COLORS = ["#7C4DFF", "#FF4D9C"] as const;

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const ProfileScreen = () => {
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      { extrapolateRight: "clamp" }
    );

    const blur = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, 100],
      { extrapolateRight: "clamp" }
    );

    return {
      height,
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
            [0, -HEADER_MAX_HEIGHT / 4],
            { extrapolateRight: "clamp" }
          ),
        },
      ],
    };
  });

  const avatarStyle = useAnimatedStyle(() => {
    const size = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [AVATAR_MAX_SIZE, AVATAR_MIN_SIZE],
      { extrapolateRight: "clamp" }
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, HEADER_MIN_HEIGHT - AVATAR_MAX_SIZE],
      { extrapolateRight: "clamp" }
    );

    const translateX = interpolate(
      scrollY.value,
      [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
      [0, -width / 3],
      { extrapolateRight: "clamp" }
    );

    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      transform: [
        { translateY },
        { translateX },
        {
          scale: interpolate(
            scrollY.value,
            [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
            [1, 0.8],
            { extrapolateRight: "clamp" }
          ),
        },
      ],
    };
  });

  const headerContentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT * 1.5],
        [1, 0],
        { extrapolateRight: "clamp" }
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
            [0, -30],
            { extrapolateRight: "clamp" }
          ),
        },
      ],
    };
  });

  const navigation = useNavigation<ProfileScreenNavigationProp>();

  const [avatarSeed, setAvatarSeed] = useState<string>("defaultSeed");
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedPreviewSeed, setSelectedPreviewSeed] = useState<string | null>(
    null
  );
  const modalScale = useSharedValue(0.8);
  const previewScale = useSharedValue(1);
  const [userPosts, setUserPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentPosts, setRecentPosts] = useState<PostType[]>([]);

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));


  const avatarPickerRef = useRef<BottomSheetModal>(null);
  const allWhispersRef = useRef<BottomSheetModal>(null);

  const { profile, setProfile, signOut, user } = useAuth();

  // const socket = useMemo(() => createSocket(user?.uid), [user?.uid]); // Removed socket
  
  useEffect(() => {
    // Subscribe to new posts
    const unsubscribeNewPosts = postService.subscribeToNewPosts((newPost) => {
      // Only add if it belongs to the current user
      if (newPost.user_id === user?.uid) {
        setUserPosts((prev) => [newPost, ...prev]);
        setRecentPosts((prev) => [newPost, ...prev]);
      }
    });

    // Subscribe to engagement updates
    const unsubscribeEngagements = postService.subscribeToPostEngagements((updatedPost) => {
       const updateList = (prev: PostType[]) => 
        prev.map((post) => 
          post.id === updatedPost.id ? { ...post, ...updatedPost } : post
        );

       setUserPosts(updateList);
       setRecentPosts(updateList);
    });

    return () => {
      unsubscribeNewPosts();
      unsubscribeEngagements();
    };
  }, [user?.uid]);



  // Initial load
  useEffect(() => {
    loadUserPosts();
  }, [profile?.id]);

  const loadUserPosts = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('user_id', '==', profile.id),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const posts: PostType[] = [];

      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data();
        const userRef = doc(db, 'users', postData.user_id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        posts.push({
          id: docSnap.id,
          ...postData,
          created_at: postData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          username: userData?.username || 'Anonymous',
          avatar_seed: userData?.avatar_seed || 'default',
        } as PostType);
      }

      setUserPosts(posts);
    } catch (error) {
      console.error('Error loading user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUserPosts = () => {
    if (!profile) return;

    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('user_id', '==', profile.id));

    const unsubscribe = onSnapshot(q, () => {
      loadUserPosts();
    });

    return unsubscribe;
  };

  const handleLogout = async () => {
    await signOut();
  };





  const navigateToPost = (post: PostType) => {
    // @ts-ignore - Navigation typing issue
    navigation.navigate("Feed", {
      screen: "FeedTab",
      params: { highlightedPostId: post.id },
    });
  };

  const RecentWhispersComponent = () => {
    if (loading) {
      return <ActivityIndicator color="#7C4DFF" />;
    }

    const recentPosts = userPosts.slice(0, 2); // Show only 2 posts

    return (
      <View>
        <View style={styles.whispersContainer}>
          {recentPosts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.whisperItem}
              onPress={() => navigateToPost(post)}
            >
              <Text style={styles.whisperContent} numberOfLines={2}>
                {post.content}
              </Text>
              <View style={styles.whisperFooter}>
                <Text style={styles.whisperTime}>
                  {formatTimeAgo(post.created_at)}
                </Text>
                <View style={styles.whisperStats}>
                  <Icon name="heart" size={14} color="#FF4D9C" />
                  <Text style={styles.statText}>{post.likes}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {userPosts.length > 2 && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => {
              console.log("Show more pressed");
              allWhispersRef.current?.present();
            }}
          >
            <Text style={styles.showMoreText}>Show More Whizpars</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const stats = useMemo(() => {
    return userPosts.reduce(
      (acc, post) => ({
        totalWhispers: userPosts.length,
        totalImpact: acc.totalImpact + (post.likes || 0) + ((post.comment_count || 0) * 2),
      }),
      { totalWhispers: 0, totalImpact: 0 }
    );
  }, [userPosts]);

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  return (
    <SafeAreaViewCompat
      style={styles.container}
      edges={["top", "right", "left"]}
    >
      <Animated.View style={[styles.header, headerStyle]}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.headerContent, headerContentStyle]}>
          <View style={styles.avatarWrapper}>
            <View style={styles.incognitoCircle}>
              <Icon name="incognito" size={60} color="#7C4DFF" />
            </View>
          </View>
          <Text style={styles.username}>{profile?.username}</Text>
          <Text style={styles.bio}>Whizparing thoughts into the void</Text>
        </Animated.View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stats}>
          <LinearGradient
            colors={GRADIENT_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.statsGradient}
          >
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalWhispers}</Text>
              <Text style={styles.statLabel}>Whizpars</Text>
              <View style={styles.statIconContainer}>
                <Icon
                  name="message-text"
                  size={20}
                  color="rgba(255,255,255,0.3)"
                />
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{formatNumber(stats.totalImpact)}</Text>
              <Text style={styles.statLabel}>Impact</Text>
              <View style={styles.statIconContainer}>
                <Icon name="star" size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </LinearGradient>
        </View>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Whizpars</Text>
          <RecentWhispersComponent />
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(WHIZPAR_ABOUT_URL)}
          >
            <LinearGradient
              colors={["rgba(124, 77, 255, 0.2)", "rgba(124, 77, 255, 0.1)"]}
              style={styles.actionButtonGradient}
            >
              <Icon name="information" size={24} color="#7C4DFF" />
              <Text style={styles.actionButtonText}>About Whizpar</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
            <LinearGradient
              colors={["rgba(255, 77, 77, 0.2)", "rgba(255, 77, 77, 0.1)"]}
              style={styles.actionButtonGradient}
            >
              <Icon name="logout" size={24} color="#FF4D4D" />
              <Text style={[styles.actionButtonText, { color: "#FF4D4D" }]}>
                Logout
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>


      <AllWhispersSheet ref={allWhispersRef} posts={userPosts} user={user} />
    </SafeAreaViewCompat>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    zIndex: 1,
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: -10,
    backgroundColor: "#7C4DFF",
    borderRadius: 12,
    padding: 4,
  },
  username: {
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    fontSize: 24,
  },
  bio: {
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.7)",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  stats: {
    margin: 16,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statsGradient: {
    flexDirection: "row",
    padding: 24,
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    position: "relative",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
  },
  statIconContainer: {
    position: "absolute",
    right: -20,
    bottom: -10,
    opacity: 0.5,
    transform: [{ rotate: "-15deg" }],
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 20,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 8,
  },
  whisperCard: {
    backgroundColor: "#1E1E1E",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  whisperHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  whisperTime: {
    color: "#6B6B6B",
    fontSize: 14,
    marginLeft: 4,
  },
  whisperContent: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  whisperStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  whisperStat: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  whisperStatText: {
    color: "#7C4DFF",
    marginLeft: 4,
    fontSize: 14,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingText: {
    color: "#FFFFFF",
    fontSize: 16,
    flex: 1,
    marginLeft: 12,
  },
  scrollContent: {
    paddingTop: HEADER_MAX_HEIGHT,
    paddingBottom: 100,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalContent: {
    width: MODAL_WIDTH,
    maxHeight: height * 0.85,
    backgroundColor: "#1E1E1E",
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.3)",
  },
  modalGradient: {
    padding: MODAL_PADDING,
    alignItems: "center",
  },
  modalTitle: {
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    fontSize: 24,
    textAlign: "center",
  },
  previewContainer: {
    alignItems: "center",
    marginBottom: 24,
    padding: 24,
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    borderRadius: 20,
    width: "100%",
  },
  selectButton: {
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 15,
  },
  selectButtonText: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
  avatarList: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    width: "100%",
  },
  incognitoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124, 77, 255, 0.3)",
  },

  columnWrapper: {
    justifyContent: "center",
  },
  avatarTouchable: {
    margin: AVATAR_MARGIN,
    borderRadius: 20,
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 2,
    borderColor: "transparent",
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  avatarTouchableSelected: {
    borderColor: "#7C4DFF",
    backgroundColor: "rgba(124, 77, 255, 0.1)",
  },
  selectedOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 2,
  },
  closeButton: {
    padding: 10,
    alignItems: "center",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  actionButtons: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  actionButtonText: {
    color: "#7C4DFF",
    fontSize: 16,
    fontWeight: "600",
  },
  coinsSection: {
    margin: 16,
    marginTop: 24,
  },
  coinsContainer: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.3)",
  },
  balanceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  balanceText: {
    fontFamily: fonts.bold,
    fontSize: 42,
    color: "#FFD700",
  },
  coinLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 4,
  },
  coinActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  coinActionButton: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  benefitsContainer: {
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    borderRadius: 16,
    padding: 16,
  },
  benefitsTitle: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 16,
    marginBottom: 12,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    padding: 12,
    borderRadius: 12,
  },
  benefitText: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  benefitPrice: {
    fontFamily: fonts.semiBold,
    color: "#FFD700",
    fontSize: 14,
  },
  createNudgeButton: {
    backgroundColor: "#7C4DFF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  createNudgeText: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  innerBalanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  viewNudgesButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  viewNudgesGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
  },
  viewNudgesText: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 14,
  },
  changeAvatarText: {
    fontFamily: fonts.regular,
    color: "#FFFFFF",
    fontSize: 16,
  },
  centerContainer: {
    padding: 24,
    alignItems: "center",
  },
  whispersContainer: {
    marginTop: 12,
  },
  whisperItem: {
    backgroundColor: "#1E1E1E",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  whisperFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emptyWhispers: {
    alignItems: "center",
    padding: 24,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: fonts.semiBold,
    marginTop: 12,
  },
  emptySubtext: {
    color: "#666",
    fontSize: 14,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  statText: {
    color: "#FF4D9C",
    fontSize: 12,
    fontFamily: fonts.regular,
  },
  showMoreButton: {
    backgroundColor: "#7C4DFF33",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  showMoreText: {
    color: "#7C4DFF",
    fontFamily: fonts.regular,
    fontSize: 14,
  },
});
