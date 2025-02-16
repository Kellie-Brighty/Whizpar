import React from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface ErrorAnimationProps {
  message: string;
}

export const ErrorAnimation: React.FC<ErrorAnimationProps> = ({ message }) => {
  return (
    <Animated.View 
      style={styles.container}
      entering={FadeIn}
      exiting={FadeOut}
    >
      <LottieView
        source={require('../../assets/animations/error-mask.json')}
        autoPlay
        loop={false}
        style={styles.animation}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  animation: {
    width: 120,
    height: 120,
  },
}); 