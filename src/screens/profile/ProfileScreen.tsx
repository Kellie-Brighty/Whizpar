import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from "react-native-reanimated";
import { BlurView } from 'expo-blur';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const HEADER_MAX_HEIGHT = 250;
const HEADER_MIN_HEIGHT = 80;
const AVATAR_MAX_SIZE = 80;
const AVATAR_MIN_SIZE = 40;

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <Animated.View style={[styles.header, headerStyle]}>
        <BlurView intensity={40} style={StyleSheet.absoluteFill} />
        <Animated.View style={[styles.headerContent, headerContentStyle]}>
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <Icon name="incognito" size={40} color="#7C4DFF" />
          </Animated.View>
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
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>42</Text>
            <Text style={styles.statLabel}>Whispers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>1.2k</Text>
            <Text style={styles.statLabel}>Impact</Text>
          </View>
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

        <View style={styles.section}>
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
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1E1E1E",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    zIndex: 1,
    overflow: 'hidden',
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#2A2A2A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#7C4DFF",
  },
  username: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  bio: {
    color: "#6B6B6B",
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  stats: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#1E1E1E",
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 16,
    elevation: 4,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#2A2A2A",
  },
  statNumber: {
    color: "#7C4DFF",
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 4,
  },
  statLabel: {
    color: "#6B6B6B",
    fontSize: 14,
  },
  section: {
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
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
});
