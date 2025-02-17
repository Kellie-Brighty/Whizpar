import React, { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts } from "../../theme/fonts";
import Animated, {
  withRepeat,
  withSequence,
  withTiming,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedProps,
} from "react-native-reanimated";

interface LoadingMaskProps {
  size?: number;
  color?: string;
}

export const LoadingMask: React.FC<LoadingMaskProps> = ({
  size = 40,
  color = "#7C4DFF",
}) => {
  const rotation = useSharedValue(0);
  const [statusText, setStatusText] = useState("Checking your location");
  const pulse1 = useSharedValue(1);
  const pulse2 = useSharedValue(1);
  const pulse3 = useSharedValue(1);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
      }),
      -1
    );

    // Animate status text
    const textInterval = setInterval(() => {
      setStatusText((prev) => {
        switch (prev) {
          case "Checking your location":
            return "Checking your location.";
          case "Checking your location.":
            return "Checking your location..";
          case "Checking your location..":
            return "Checking your location...";
          default:
            return "Checking your location";
        }
      });
    }, 500);

    // Add pulse animations
    pulse1.value = withRepeat(
      withSequence(
        withTiming(1.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );

    setTimeout(() => {
      pulse2.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
    }, 333);

    setTimeout(() => {
      pulse3.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1
      );
    }, 666);

    return () => {
      clearInterval(textInterval);
    };
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Add these animated styles
  const pulseStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1.value }],
    opacity: withTiming(pulse1.value === 1 ? 0.6 : 0, { duration: 1000 }),
  }));
  const pulseStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2.value }],
    opacity: withTiming(pulse2.value === 1 ? 0.6 : 0, { duration: 1000 }),
  }));
  const pulseStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse3.value }],
    opacity: withTiming(pulse3.value === 1 ? 0.6 : 0, { duration: 1000 }),
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["rgba(124, 77, 255, 0.1)", "rgba(255, 77, 156, 0.1)"]}
        style={styles.content}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Animated.View style={[styles.spinner, spinStyle]}>
            <Icon name="map-marker-radius" size={size} color={color} />
          </Animated.View>
          <View style={styles.pulseContainer}>
            <Animated.View style={[styles.pulse, pulseStyle1]} />
            <Animated.View style={[styles.pulse, pulseStyle2]} />
            <Animated.View style={[styles.pulse, pulseStyle3]} />
          </View>
        </View>
        <Text style={styles.status}>{statusText}</Text>
        <Text style={styles.description}>
          We need to verify your location to ensure you're in a supported region
        </Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    alignItems: "center",
    padding: 32,
    borderRadius: 24,
  },
  iconContainer: {
    position: "relative",
    marginBottom: 24,
  },
  spinner: {
    padding: 16,
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    borderRadius: 40,
  },
  status: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  pulseContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  pulse: {
    position: "absolute",
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    borderRadius: 100,
    width: 80,
    height: 80,
  },
});
