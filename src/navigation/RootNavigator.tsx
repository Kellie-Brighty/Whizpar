import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "./types";
import { CreateProfileScreen } from "../screens/profile/CreateProfileScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const { user, profile, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("@onboarding_complete").then((value) => {
      setIsFirstLaunch(value === null);
    });
  }, []);

  if (loading) {
    return null;
  }

  console.log("RootNavigator state:", {
    user: !!user,
    hasProfile: !!profile,
    isFirstLaunch,
    profileData: profile,
  });

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? (profile ? "MainTab" : "CreateProfile") : "Auth"}
    >
      {!user ? (
        <>
          {isFirstLaunch && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      ) : !profile ? (
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      ) : (
        <Stack.Screen name="MainTab" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
