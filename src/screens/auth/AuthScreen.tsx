import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Surface } from "react-native-paper";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  useSharedValue,
  SharedValue,
} from "react-native-reanimated";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
} from "../../utils/biometrics";
import * as Crypto from "expo-crypto";
import {
  MaskAnimation,
  LoadingMask,
  ErrorMask,
} from "../../components/animations";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RandomAvatar } from "../../components/RandomAvatar";
import { checkUserLocation } from "../../services/locationService";
import { RegionRestrictedScreen } from "../region/RegionRestrictedScreen";
import { SmallLoadingMask } from "../../components/animations/SmallLoadingMask";
import { authService } from "../../services/authService";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

const { width, height } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MaskAnimationProps {
  scale?: SharedValue<number>;
  rotate?: SharedValue<number>;
  color?: string;
  size?: number;
}

export const AuthScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isLocationChecked, setIsLocationChecked] = useState(false);
  const [isRegionAllowed, setIsRegionAllowed] = useState(true);
  const formPosition = useSharedValue(0);
  const maskPosition = useSharedValue(0);
  const maskScale = useSharedValue(1);
  const [selectedAvatar, setSelectedAvatar] = useState<string>("defaultSeed");

  // Separate effect for biometrics
  useEffect(() => {
    checkBiometricAvailability().then(setHasBiometrics);
  }, []);

  // Separate effect for location check
  useEffect(() => {
    const verifyLocation = async () => {
      const isAllowed = await checkUserLocation();
      setIsRegionAllowed(isAllowed);
      setIsLocationChecked(true);
      console.log("isAllowed", isAllowed);
    };
    verifyLocation();
  }, []);

  const toggleMode = () => {
    formPosition.value = withSpring(isLogin ? 1 : 0);
    maskPosition.value = withTiming(isLogin ? 1 : 0, { duration: 1000 });
    setIsLogin(!isLogin);
  };

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            formPosition.value,
            [0, 1],
            [0, height * 0.1]
          ),
        },
      ],
    };
  });

  const maskAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(maskPosition.value, [0, 1], [0, width * 0.1]),
        },
      ],
    };
  });

  const handleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!email.trim() || !password.trim()) {
        throw new Error("Please fill in all fields");
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      if (authData.user) {
        console.log("Sign in successful:", authData.user.id);
        // Let AuthContext handle the navigation
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Auth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.clear();
      console.log("Storage cleared successfully");
    } catch (e) {
      console.error("Error clearing storage:", e);
    }
  };

  if (!isLocationChecked) {
    return <LoadingMask />;
  }

  if (!isRegionAllowed) {
    return <RegionRestrictedScreen />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <MaskAnimation scale={maskScale} rotate={maskPosition} />
        <Animated.View style={[styles.titleContainer, maskAnimatedStyle]}>
          <Text style={styles.title}>Whizpar</Text>
          <View style={styles.avatarContainer}>
            <RandomAvatar seed={selectedAvatar} size={120} />
          </View>
          <Text style={styles.subtitle}>
            {isLogin ? "Welcome back, stranger" : "Join anonymously"}
          </Text>
        </Animated.View>
      </View>

      {error && <ErrorMask message={error} />}

      <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
        <Surface style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="email" size={20} color="#7C4DFF" />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#6B6B6B"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Icon name="lock" size={20} color="#7C4DFF" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#6B6B6B"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {hasBiometrics && (
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={() => authenticateWithBiometrics()}
            >
              <Icon name="fingerprint" size={24} color="#7C4DFF" />
              <Text style={styles.biometricText}>Use biometrics</Text>
            </TouchableOpacity>
          )}

          {isLoading ? (
            <SmallLoadingMask />
          ) : (
            <TouchableOpacity
              style={[styles.button, !email && styles.buttonDisabled]}
              onPress={handleAuth}
              // disabled={!email}
            >
              <Text style={styles.buttonText}>
                {isLogin ? "Enter" : "Create Account"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Need an anonymous identity?"
                : "Already have an identity?"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.privacyNote}>
            Your email is only used for authentication and will never be shown
            publicly. You'll get a random anonymous identity after signing in.
          </Text>

          {/* <TouchableOpacity onPress={clearStorage}>
            <Text>Clear Storage</Text>
          </TouchableOpacity> */}
        </Surface>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    height: height * 0.45,
    justifyContent: "center",
    alignItems: "center",
  },
  maskAnimation: {
    width: width * 0.5,
    height: width * 0.5,
  },
  titleContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B6B6B",
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: "#1E1E1E",
    borderRadius: 20,
    padding: 20,
    elevation: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#363636",
  },
  input: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 16,
    paddingVertical: 12,
    marginLeft: 12,
  },
  button: {
    backgroundColor: "#7C4DFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleButton: {
    marginTop: 20,
    alignItems: "center",
  },
  toggleText: {
    color: "#7C4DFF",
    fontSize: 14,
  },
  loadingContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  biometricText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 0,
    marginBottom: 20,
  },
  changeAvatarText: {
    color: "#7C4DFF",
    marginTop: 10,
  },
  privacyNote: {
    color: "#6B6B6B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
});
