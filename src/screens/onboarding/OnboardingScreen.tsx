import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ViewToken,
} from "react-native";
import LottieView from "lottie-react-native";
import { Surface } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AnonymousAnimation,
  CommunityAnimation,
  SafeSpaceAnimation,
} from "../../components/animations/onboarding";

const { width } = Dimensions.get("window");

interface Slide {
  id: number;
  title: string;
  description: string;
  AnimationComponent: React.FC;
}

interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<any>;
}

interface OnboardingItemProps {
  item: Slide;
  width: number;
}

interface PaginatorProps {
  data: Slide[];
  scrollX: Animated.Value;
}

const slides: Slide[] = [
  {
    id: 1,
    title: "Share Anonymously",
    description: "Express yourself freely without revealing your identity",
    AnimationComponent: AnonymousAnimation,
  },
  {
    id: 2,
    title: "Connect & Support",
    description: "Find people who understand and support each other",
    AnimationComponent: CommunityAnimation,
  },
  {
    id: 3,
    title: "Safe Space",
    description: "A judgment-free zone for sharing your thoughts",
    AnimationComponent: SafeSpaceAnimation,
  },
];

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<Animated.FlatList>(null);

  const viewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setCurrentIndex(viewableItems[0]?.index || 0);
    }
  ).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = async () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem("@onboarding_complete", "true");
        navigation.navigate("Auth");
      } catch (err) {
        console.log("Error @setItem: ", err);
      }
    }
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={slidesRef}
        data={slides}
        renderItem={({ item }) => <OnboardingItem item={item} width={width} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id.toString()}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={32}
      />

      <Paginator data={slides} scrollX={scrollX} />

      <Surface style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={scrollTo}>
          <Text style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </Surface>
    </View>
  );
};

const OnboardingItem: React.FC<OnboardingItemProps> = ({ item, width }) => {
  return (
    <View style={[styles.slide, { width }]}>
      <item.AnimationComponent />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
};

const Paginator: React.FC<PaginatorProps> = ({ data, scrollX }) => {
  return (
    <View style={styles.paginatorContainer}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 20, 8],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            style={[styles.dot, { width: dotWidth, opacity }]}
            key={i.toString()}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    alignItems: "center",
    justifyContent: "center",
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  animation: {
    width: width * 0.8,
    height: width * 0.8,
  },
  textContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: "#6B6B6B",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 20,
    backgroundColor: "#1E1E1E",
  },
  button: {
    backgroundColor: "#7C4DFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  paginatorContainer: {
    flexDirection: "row",
    position: "absolute",
    bottom: 100,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#7C4DFF",
    marginHorizontal: 4,
  },
});
