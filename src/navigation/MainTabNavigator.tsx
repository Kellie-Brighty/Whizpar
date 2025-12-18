import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import Animated, {
  FadeIn,
  FadeOut,
  withSpring,
  useAnimatedStyle,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { StyleSheet, View, Dimensions, Platform } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { FeedScreen } from "../screens/feed/FeedScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import { fonts } from "../theme/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const AnimatedIcon = ({ 
  name, 
  color, 
  size, 
  focused 
}: { 
  name: string; 
  color: string; 
  size: number; 
  focused: boolean 
}) => {
  // Animation for the icon (scale + slight lift)
  const itemAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: withSpring(focused ? 1 : 0.9) },
        { translateY: withSpring(focused ? -2 : 0) }, // Slight lift
      ],
    };
  });

  // Animation for the background indicator
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(focused ? 1 : 0),
      transform: [
        { scale: withSpring(focused ? 1 : 0) },
      ],
    };
  });

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[styles.activeIndicator, indicatorAnimatedStyle]} />
      <Animated.View style={[itemAnimatedStyle, styles.iconContainer]}>
        <Icon name={name} size={size} color={color} />
      </Animated.View>
    </View>
  );
};

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
          bottom: 25,
          left: 20,
          right: 20,
          backgroundColor: "transparent",
          elevation: 0,
          height: 70, // Slightly reduced height for tighter feel
          borderRadius: 35,
          borderTopWidth: 0,
          paddingBottom: 0,
          paddingHorizontal: 0,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarContainer}>
            <BlurView
              intensity={90}
              style={[StyleSheet.absoluteFill, styles.blurView]}
              tint="dark"
            >
              <View style={styles.tabBarOverlay} />
            </BlurView>
          </View>
        ),
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.4)",
        tabBarShowLabel: false,
        headerShown: false,
        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon
              name="home-variant-outline" // Always outlined
              size={42}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon
              name="account-circle-outline" // Always outlined
              size={42}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 35,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },
  blurView: {
    flex: 1,
    borderRadius: 35,
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20, 20, 20, 0.85)", // Slightly darker for premium feel
    borderRadius: 35,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  iconWrapper: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  activeIndicator: {
    position: 'absolute',
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: 'rgba(124, 77, 255, 0.2)', // Soft purple glow
    zIndex: 1,
  },
});
