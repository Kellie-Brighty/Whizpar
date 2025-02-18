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
import { PublicNudgesScreen } from "../screens/nudges/PublicNudgesScreen";
import { fonts } from "../theme/fonts";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();

const AnimatedIcon = ({ name, color, size, focused }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSequence(
            withSpring(focused ? 1.2 : 1),
            withDelay(150, withSpring(1))
          ),
        },
      ],
    };
  });

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut}
      style={[animatedStyle, styles.iconContainer]}
    >
      <Icon name={name} size={size} color={color} />
    </Animated.View>
  );
};

export const MainTabNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={80}
            style={[StyleSheet.absoluteFill, styles.tabBarBackground]}
            tint="dark"
          >
            <View style={styles.tabBarOverlay} />
          </BlurView>
        ),
        tabBarActiveTintColor: "#7C4DFF",
        tabBarInactiveTintColor: "rgba(255, 255, 255, 0.5)",
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontFamily: fonts.semiBold,
          fontSize: 12,
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon
              name="home"
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Nudges"
        component={PublicNudgesScreen}
        options={{
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedIcon
              name="bullhorn"
              size={size}
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
              name="account"
              size={size}
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
  tabBarBackground: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  tabBarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 18, 18, 0.7)",
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
});
