import React, { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface LoadingMaskProps {
  size?: number;
  color?: string;
}

export const LoadingMask: React.FC<LoadingMaskProps> = ({
  size = 40,
  color = "#7C4DFF"
}) => {
  const rotation = new Animated.Value(0);

  useEffect(() => {
    const animate = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animate();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.spinner, { transform: [{ rotate: spin }] }]}>
        <Icon name="incognito" size={size} color={color} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    padding: 8,
  },
}); 