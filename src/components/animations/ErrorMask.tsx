import React, { useEffect } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

interface ErrorMaskProps {
  message: string;
}

export const ErrorMask: React.FC<ErrorMaskProps> = ({ message }) => {
  const shake = new Animated.Value(0);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: -1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [message]);

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity,
          transform: [
            {
              translateX: shake.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-10, 0, 10]
              })
            }
          ]
        }
      ]}
    >
      <Icon name="alert-circle" size={24} color="#FF4081" />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 8,
    margin: 16,
  },
  message: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontSize: 14,
  },
}); 