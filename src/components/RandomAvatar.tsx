import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SvgXml } from "react-native-svg";

const AVATAR_API_URL = "https://api.dicebear.com/9.x/lorelei/svg";

interface RandomAvatarProps {
  seed: string;
  size?: number;
}

export const RandomAvatar: React.FC<RandomAvatarProps> = ({
  seed,
  size = 80,
}) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch(`${AVATAR_API_URL}?seed=${seed}`);
        const svgText = await response.text();
        setSvgContent(svgText);
      } catch (error) {
        console.error("Error fetching avatar:", error);
      }
    };

    fetchAvatar();
  }, [seed]);

  return (
    <View style={styles.container}>
      {svgContent && <SvgXml xml={svgContent} width={size} height={size} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 50, // Make the avatar circular
    overflow: "hidden",
  },
});
