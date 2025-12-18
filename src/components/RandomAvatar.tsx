import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { getEmojiAvatar, getAvatarColor } from "../utils/emojiUtils";

interface RandomAvatarProps {
  seed: string;
  size?: number;
}

export const RandomAvatar: React.FC<RandomAvatarProps> = ({
  seed,
  size = 80,
}) => {
  const emoji = useMemo(() => getEmojiAvatar(seed), [seed]);
  const backgroundColor = useMemo(() => getAvatarColor(seed), [seed]);
  const fontSize = size * 0.6; // Emoji size relative to container

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
      ]}
    >
      <Text style={{ fontSize }}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
