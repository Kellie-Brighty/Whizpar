import React, { useState, useEffect, useRef } from "react";
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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RandomAvatar } from "../../components/RandomAvatar";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { fonts } from "../../theme/fonts";
import { CoinPurchaseSheet } from "../../components/sheets/CoinPurchaseSheet";
import { TransactionHistorySheet } from "../../components/sheets/TransactionHistorySheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AvatarPickerSheet } from "../../components/sheets/AvatarPickerSheet";

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

type ProfileScreenNavigationProp =
  NativeStackNavigationProp<RootStackParamList>;

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

  const modalAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  const previewAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: previewScale.value }],
  }));

  const purchaseSheetRef = useRef<BottomSheetModal>(null);
  const historySheetRef = useRef<BottomSheetModal>(null);
  const avatarPickerRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    const loadAvatar = async () => {
      const storedAvatar = await AsyncStorage.getItem("@user_avatar");
      if (storedAvatar) {
        setAvatarSeed(storedAvatar);
      }
    };

    loadAvatar();
  }, []);

  const handleAvatarSelect = async (seed: string) => {
    try {
      console.log("Selected Avatar Seed:", seed);
      setAvatarSeed(seed);
      await AsyncStorage.setItem("@user_avatar", seed);
      setModalVisible(false);
    } catch (error) {
      console.error("Error storing avatar:", error);
    }
  };

  const avatarSeeds = Array.from({ length: 10 }, () =>
    Math.random().toString(36).substring(7)
  );

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("@auth_token");
      navigation.reset({
        index: 0,
        routes: [{ name: "Auth" }],
      });
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleBuyCoins = () => {
    purchaseSheetRef.current?.present();
  };

  const handleShowHistory = () => {
    historySheetRef.current?.present();
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
            <RandomAvatar seed={avatarSeed} />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => avatarPickerRef.current?.present()}
            >
              <Icon name="pencil" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.username}>Anonymous</Text>
          <Text style={styles.bio}>Whispering thoughts into the void</Text>
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
              <Text style={styles.statNumber}>42</Text>
              <Text style={styles.statLabel}>Whispers</Text>
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
              <Text style={styles.statNumber}>1.2k</Text>
              <Text style={styles.statLabel}>Impact</Text>
              <View style={styles.statIconContainer}>
                <Icon name="star" size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.coinsSection}>
          <LinearGradient
            colors={["rgba(255, 215, 0, 0.15)", "rgba(124, 77, 255, 0.15)"]}
            style={styles.coinsContainer}
          >
            <Animated.View
              entering={FadeIn.duration(500)}
              style={styles.balanceContainer}
            >
              <Icon name="cash" size={32} color="#FFD700" />
              <Text style={styles.balanceText}>1,250</Text>
              <Text style={styles.coinLabel}>Whizpar Coins</Text>
            </Animated.View>

            <View style={styles.coinActions}>
              <TouchableOpacity
                style={styles.coinActionButton}
                onPress={handleBuyCoins}
              >
                <LinearGradient
                  colors={["#FFD700", "#FFA000"]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="plus" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Buy Coins</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.coinActionButton}
                onPress={handleShowHistory}
              >
                <LinearGradient
                  colors={["#7C4DFF", "#FF4D9C"]}
                  style={styles.actionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Icon name="history" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>History</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Coin Benefits</Text>
              <View style={styles.benefitsList}>
                <View style={styles.benefitItem}>
                  <Icon name="palette" size={20} color="#7C4DFF" />
                  <Text style={styles.benefitText}>Custom Avatars</Text>
                  <Text style={styles.benefitPrice}>500 coins</Text>
                </View>
                <View style={styles.benefitItem}>
                  <Icon name="bullhorn" size={20} color="#7C4DFF" />
                  <Text style={styles.benefitText}>Public Nudge</Text>
                  <Text style={styles.benefitPrice}>1000 coins</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Recent Whispers</Text>
          {[1, 2, 3].map((item) => (
            <TouchableOpacity
              key={item}
              style={styles.whisperCard}
              onPress={() => {}}
            >
              <View style={styles.whisperHeader}>
                <Icon name="clock-outline" size={16} color="#6B6B6B" />
                <Text style={styles.whisperTime}>2 days ago</Text>
              </View>
              <Text style={styles.whisperContent}>
                Thoughts become whispers, whispers become changes...
              </Text>
              <View style={styles.whisperStats}>
                <View style={styles.whisperStat}>
                  <Icon name="heart-outline" size={16} color="#7C4DFF" />
                  <Text style={styles.whisperStatText}>24</Text>
                </View>
                <View style={styles.whisperStat}>
                  <Icon name="comment-outline" size={16} color="#7C4DFF" />
                  <Text style={styles.whisperStatText}>8</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="theme-light-dark" size={24} color="#7C4DFF" />
            <Text style={styles.settingText}>Theme</Text>
            <Icon name="chevron-right" size={24} color="#6B6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="bell-outline" size={24} color="#7C4DFF" />
            <Text style={styles.settingText}>Notifications</Text>
            <Icon name="chevron-right" size={24} color="#6B6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Icon name="shield-outline" size={24} color="#7C4DFF" />
            <Text style={styles.settingText}>Privacy</Text>
            <Icon name="chevron-right" size={24} color="#6B6B6B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <Icon name="logout" size={24} color="#7C4DFF" />
            <Text style={styles.settingText}>Logout</Text>
            <Icon name="chevron-right" size={24} color="#6B6B6B" />
          </TouchableOpacity>
        </View> */}

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

      <AvatarPickerSheet
        ref={avatarPickerRef}
        onSelect={handleAvatarSelect}
        selectedSeed={avatarSeed}
      />

      <CoinPurchaseSheet ref={purchaseSheetRef} />
      <TransactionHistorySheet ref={historySheetRef} />
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
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 18,
    marginBottom: 12,
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
    marginTop: 8,
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
});
