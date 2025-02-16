import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { FeedScreen } from "../screens/feed/FeedScreen";
import { ProfileScreen } from "../screens/profile/ProfileScreen";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { StyleSheet, View, Dimensions } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolate,
  withDelay,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";

const { width } = Dimensions.get("window");
const TAB_WIDTH = width;
const Tab = createBottomTabNavigator();

const TabIcon = ({ focused, name }: { focused: boolean; name: string }) => {
  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSequence(
            withSpring(focused ? -8 : 0, {
              damping: 12,
              stiffness: 200,
            }),
            withDelay(
              150,
              withSpring(focused ? -4 : 0, {
                damping: 8,
                stiffness: 150,
              })
            )
          ),
        },
        {
          scale: withSpring(focused ? 1.2 : 1, {
            damping: 15,
            stiffness: 200,
          }),
        },
      ],
    };
  }, [focused]);

  const dotStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(focused ? 1 : 0, { damping: 20 }),
      width: withSpring(focused ? 4 : 0, { damping: 15 }),
      height: withSpring(focused ? 4 : 0, { damping: 15 }),
    };
  }, [focused]);

  return (
    <View style={styles.iconWrapper}>
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        <Icon name={name} size={24} color={focused ? "#7C4DFF" : "#6B6B6B"} />
      </Animated.View>
      <Animated.View style={[styles.dot, dotStyle]} />
    </View>
  );
};

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          <BlurView intensity={30} style={StyleSheet.absoluteFill}>
            <View style={styles.tabBarBackground}>
              <View style={styles.innerShadow} />
            </View>
          </BlurView>
        ),
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="home" />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} name="account" />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 20,
    width: TAB_WIDTH,
    height: 65,
    backgroundColor: "transparent",
    borderTopWidth: 0,
    elevation: 0,
    borderRadius: 32,
    paddingBottom: 8,
    overflow: "hidden",
  },
  tabBarBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(30, 30, 30, 0.85)",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "#2A2A2A",
  },
  innerShadow: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 32,
    backgroundColor: "#1E1E1E",
    borderWidth: 1,
    borderColor: "#2A2A2A",
    opacity: 0.5,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 60,
    width: TAB_WIDTH / 2,
  },
  iconContainer: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    backgroundColor: "#7C4DFF",
    borderRadius: 2,
    marginTop: 4,
  },
});
