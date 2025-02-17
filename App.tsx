import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider } from "react-native-paper";
import { NavigationContainer } from "@react-navigation/native";
import { PostProvider } from "./src/context/PostContext";
import { RootNavigator } from "./src/navigation/RootNavigator";
import * as Font from "expo-font";

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    "Nunito Sans": require("./assets/fonts/NunitoSans-Regular.ttf"),
    "Nunito Sans SemiBold": require("./assets/fonts/NunitoSans-SemiBold.ttf"),
    "Nunito Sans Bold": require("./assets/fonts/NunitoSans-Bold.ttf"),
    "Nunito Sans ExtraBold": require("./assets/fonts/NunitoSans-ExtraBold.ttf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <PaperProvider>
            <PostProvider>
              <RootNavigator />
            </PostProvider>
          </PaperProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
