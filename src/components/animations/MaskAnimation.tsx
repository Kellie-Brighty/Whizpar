import React from "react";
import { StyleSheet, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";

interface MaskAnimationProps {
  scale: SharedValue<number>;
  rotate: SharedValue<number>;
  color?: string;
  size?: number;
}

export const MaskAnimation: React.FC<MaskAnimationProps> = ({
  scale,
  rotate,
  color = "#7C4DFF",
  size = 80,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      {
        rotate: `${interpolate(rotate.value, [0, 1], [0, 360])}deg`,
      },
    ],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Icon name="incognito" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    padding: 12,
  },
});
