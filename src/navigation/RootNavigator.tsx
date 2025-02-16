import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { OnboardingScreen } from "../screens/onboarding/OnboardingScreen";
import { AuthScreen } from "../screens/auth/AuthScreen";
import { MainTabNavigator } from "./MainTabNavigator";
import { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const [hasSeenOnboarding, authToken] = await Promise.all([
        AsyncStorage.getItem("@onboarding_complete"),
        AsyncStorage.getItem("@auth_token"),
      ]);

      setIsFirstLaunch(hasSeenOnboarding === null);
      setIsAuthenticated(authToken !== null);
    } catch (error) {
      console.error("Error checking initial state:", error);
      setIsFirstLaunch(true);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Not authenticated flow
        <>
          {isFirstLaunch && (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          )}
          <Stack.Screen name="Auth" component={AuthScreen} />
          <Stack.Screen name="Main" component={MainTabNavigator} />
        </>
      ) : (
        // Authenticated flow
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen name="Auth" component={AuthScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
