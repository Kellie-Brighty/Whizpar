import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  useSharedValue,
} from 'react-native-reanimated';
import { FeedScreen } from '../screens/feed/FeedScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const tabWidth = width / state.routes.length;
  const activeIndex = useSharedValue(0);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(activeIndex.value * tabWidth, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <BlurView intensity={30} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.indicator, indicatorStyle]} />
      <View style={styles.tabContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const iconName = 
            route.name === 'Feed' ? 'home' :
            route.name === 'Profile' ? 'account' : 'home';

          const AnimatedIcon = Animated.createAnimatedComponent(Icon);
          const iconScale = useSharedValue(1);
          const iconRotate = useSharedValue(0);

          const iconStyle = useAnimatedStyle(() => {
            return {
              transform: [
                { scale: iconScale.value },
                { rotate: `${iconRotate.value}deg` },
              ],
            };
          });

          const handlePress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
              activeIndex.value = index;
              iconScale.value = withSpring(1.2, {}, () => {
                iconScale.value = withSpring(1);
              });
              iconRotate.value = withTiming(360, {
                duration: 500,
              }, () => {
                iconRotate.value = 0;
              });
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={styles.tab}
              onPress={handlePress}
              activeOpacity={0.7}
            >
              <AnimatedIcon
                name={iconName}
                size={24}
                style={[
                  iconStyle,
                  { color: isFocused ? '#7C4DFF' : '#6B6B6B' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 70,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 35,
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    height: '100%',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    width: width / 2 - 20,
    height: '100%',
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    borderRadius: 35,
  },
});
