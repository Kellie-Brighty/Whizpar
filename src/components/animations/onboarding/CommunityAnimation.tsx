import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export const CommunityAnimation = () => {
  const position1 = useRef(new Animated.Value(0)).current;
  const position2 = useRef(new Animated.Value(0)).current;
  const position3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(position1, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(position1, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(position2, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(position2, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(position3, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(position3, {
            toValue: 0,
            duration: 2500,
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
          styles.icon,
          {
            transform: [
              {
                translateY: position1.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -20],
                }),
              },
            ],
          },
        ]}
      >
        <Icon name="account-group" size={100} color="#7C4DFF" />
      </Animated.View>
      <View style={styles.connectingIcons}>
        <Animated.View
          style={[
            styles.smallIcon,
            {
              transform: [
                {
                  translateY: position2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 20],
                  }),
                },
              ],
            },
          ]}
        >
          <Icon name="message-text" size={40} color="#7C4DFF" />
        </Animated.View>
        <Animated.View
          style={[
            styles.smallIcon,
            {
              transform: [
                {
                  translateY: position3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
              ],
            },
          ]}
        >
          <Icon name="heart" size={40} color="#7C4DFF" />
        </Animated.View>
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
  icon: {
    marginBottom: 20,
  },
  connectingIcons: {
    flexDirection: 'row',
    width: 150,
    justifyContent: 'space-between',
  },
  smallIcon: {
    opacity: 0.7,
  },
}); 