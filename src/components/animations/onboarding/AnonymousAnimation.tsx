import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export const AnonymousAnimation = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scale, {
              toValue: 1.2,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    
    animation.start();

    return () => {
      animation.stop();
    };
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            opacity,
            transform: [{ scale }, { rotate: spin }],
          },
        ]}
      >
        <Icon name="incognito" size={120} color="#7C4DFF" />
      </Animated.View>
      <Animated.View
        style={[
          styles.shadowContainer,
          {
            transform: [{ scale }],
          },
        ]}
      >
        <Icon name="shield-lock" size={80} color="#7C4DFF" style={styles.shadowIcon} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  iconContainer: {
    position: 'absolute',
  },
  shadowContainer: {
    position: 'absolute',
    opacity: 0.2,
  },
  shadowIcon: {
    opacity: 0.3,
  },
}); 