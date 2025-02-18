import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fonts } from "../../theme/fonts";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, SlideInRight } from "react-native-reanimated";
import { PublicNudge } from "../../types";
import { eventEmitter } from "../../utils/EventEmitter";

const MOCK_NUDGES: PublicNudge[] = [
  {
    id: "1",
    title: "Local Art Gallery Opening",
    description:
      "Featuring contemporary African art pieces. Special discounts for opening week!",
    imageUrl:
      "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=800&auto=format&fit=crop",
    daysLeft: 5,
    impressions: 1234,
    createdAt: new Date().toISOString(),
  },
  // Add more mock data
];

const NudgeCard = ({ nudge, index }: { nudge: PublicNudge; index: number }) => (
  <Animated.View
    entering={SlideInRight.delay(index * 100)}
    style={styles.cardContainer}
  >
    <LinearGradient
      colors={["rgba(124, 77, 255, 0.1)", "rgba(255, 77, 156, 0.1)"]}
      style={styles.cardGradient}
    >
      {nudge.imageUrl && (
        <Image source={{ uri: nudge.imageUrl }} style={styles.cardImage} />
      )}

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{nudge.title}</Text>
        <Text style={styles.cardDescription}>{nudge.description}</Text>

        <View style={styles.cardFooter}>
          <View style={styles.footerItem}>
            <Icon name="clock-outline" size={16} color="#7C4DFF" />
            <Text style={styles.footerText}>{nudge.daysLeft} days left</Text>
          </View>

          <View style={styles.footerItem}>
            <Icon name="eye-outline" size={16} color="#7C4DFF" />
            <Text style={styles.footerText}>{nudge.impressions} views</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  </Animated.View>
);

export const PublicNudgesScreen = () => {
  const [nudges, setNudges] = useState<PublicNudge[]>(MOCK_NUDGES);

  useEffect(() => {
    // Listen for new nudges
    const subscription = eventEmitter.addListener(
      "newNudge",
      (nudge: PublicNudge) => {
        setNudges((prev) => [nudge, ...prev]);
      }
    );

    return () => {
      // Clean up subscription
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "right", "left"]}>
      <View style={styles.header}>
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Public Nudges</Text>
            <Text style={styles.subtitle}>
              Local promotions & announcements
            </Text>
          </View>
        </View>
      </View>

      <FlatList
        data={nudges}
        renderItem={({ item, index }) => (
          <NudgeCard nudge={item} index={index} />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    height: 120,
    backgroundColor: "rgba(30, 30, 30, 0.8)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 16,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    flex: 1,
    padding: 16,
    justifyContent: "flex-end",
  },
  titleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  listContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 100,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#7C4DFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 16,
  },
  cardImage: {
    width: "100%",
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: "#7C4DFF",
  },
});
