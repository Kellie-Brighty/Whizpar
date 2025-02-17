import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface SmallLoadingMaskProps {
  size?: number;
  color?: string;
}

export const SmallLoadingMask: React.FC<SmallLoadingMaskProps> = ({
  size = 24,
  color = "#7C4DFF",
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000 }),
      -1
    );
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.iconWrapper}>
        <Animated.View style={spinStyle}>
          <Icon name="incognito" size={size} color={color} />
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
  },
  iconWrapper: {
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    borderRadius: 24,
    padding: 8,
  },
}); 