import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fonts } from "../../theme/fonts";
import { MaskAnimation } from "../../components/animations/MaskAnimation";
import Animated, { FadeIn, useSharedValue } from "react-native-reanimated";

export const RegionRestrictedScreen = () => {
  const scale = useSharedValue(1.2);
  const rotate = useSharedValue(0.2);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
        <MaskAnimation
          scale={scale}
          rotate={rotate}
          size={120}
          color="#7C4DFF"
        />

        <Text style={styles.title}>Coming Soon to Your Area!</Text>
        <Text style={styles.description}>
          Whizpar is currently only available in Ile-Ife, Nigeria. We're working
          hard to bring our anonymous community platform to more regions soon.
        </Text>

        <View style={styles.infoContainer}>
          <Icon name="map-marker" size={24} color="#7C4DFF" />
          <Text style={styles.infoText}>Currently Available in:</Text>
          <Text style={styles.location}>Ile-Ife, Nigeria</Text>
        </View>

        <TouchableOpacity
          onPress={() => Linking.openURL("https://whizpar.com/waitlist")}
          style={styles.button}
        >
          <LinearGradient
            colors={["#7C4DFF", "#FF4D9C"]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.buttonText}>Join Waitlist</Text>
            <Icon name="arrow-right" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
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
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: "#FFFFFF",
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 24,
  },
  infoContainer: {
    alignItems: "center",
    backgroundColor: "rgba(124, 77, 255, 0.1)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    width: "100%",
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    marginTop: 8,
  },
  location: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#7C4DFF",
    marginTop: 4,
  },
  button: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  buttonText: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
});
