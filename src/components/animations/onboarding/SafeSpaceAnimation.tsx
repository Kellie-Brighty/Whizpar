import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export const SafeSpaceAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = new Animated.Value(0);
  const shieldOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(shieldOpacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shieldOpacity, {
            toValue: 0.5,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    
    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.shieldContainer,
          {
            opacity: shieldOpacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Icon name="shield" size={120} color="#7C4DFF" />
      </Animated.View>
      <View style={styles.iconContainer}>
        <Icon name="home-heart" size={60} color="#7C4DFF" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  shieldContainer: {
    position: 'absolute',
  },
  iconContainer: {
    position: 'absolute',
  },
}); 