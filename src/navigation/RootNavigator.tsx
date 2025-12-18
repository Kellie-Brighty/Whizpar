import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { useAuth } from "../contexts/AuthContext";
import { RootStackParamList } from "./types";
import { CreateProfileScreen } from "../screens/profile/CreateProfileScreen";

import { View } from "react-native";
import { PulsingLoader } from "../components/ui/PulsingLoader";
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
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" }}>
        <PulsingLoader />
      </View>
    );
  }

  console.log("RootNavigator navigation state:", {
    user: !!user,
    hasProfile: !!profile,
    isFirstLaunch,
    profileData: profile,
    shouldShowMainTab: !!user && !!profile,
    shouldShowCreateProfile: !!user && !profile,
  });

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Not authenticated flow
        <>
          {isFirstLaunch && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      ) : profile ? (
        // Has profile - show main app
        <Stack.Screen name="MainTab" component={MainTabNavigator} />
      ) : (
        // No profile - show create profile
        <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      )}
    </Stack.Navigator>
  );
};
