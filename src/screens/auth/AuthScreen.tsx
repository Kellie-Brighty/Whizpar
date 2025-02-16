import React, { useState, useRef, useEffect } from "react";
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

const { width, height } = Dimensions.get("window");

interface AuthScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, "Auth">;
}

interface MaskAnimationProps {
  scale?: SharedValue<number>;
  rotate?: SharedValue<number>;
  color?: string;
  size?: number;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const formPosition = useSharedValue(0);
  const maskPosition = useSharedValue(0);

  useEffect(() => {
    checkBiometricAvailability().then(setHasBiometrics);
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

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!username.trim() || !password.trim()) {
        throw new Error("Please fill in all fields");
      }

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      if (hasBiometrics) {
        const authenticated = await authenticateWithBiometrics();
        if (!authenticated) {
          throw new Error("Biometric authentication failed");
        }
      }

      // Set auth token
      await AsyncStorage.setItem("@auth_token", "dummy_token");

      // Navigate to Main screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <MaskAnimation scale={useSharedValue(1)} rotate={maskPosition} />
        <Animated.View style={[styles.titleContainer, maskAnimatedStyle]}>
          <Text style={styles.title}>Whizpar</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Welcome back, stranger" : "Join anonymously"}
          </Text>
        </Animated.View>
      </View>

      {error && <ErrorMask message={error} />}

      <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
        <Surface style={styles.form}>
          <View style={styles.inputContainer}>
            <Icon name="incognito" size={20} color="#7C4DFF" />
            <TextInput
              style={styles.input}
              placeholder="Anonymous ID"
              placeholderTextColor="#6B6B6B"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
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
            <View style={styles.loadingContainer}>
              <LoadingMask />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, !username && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={!username}
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
    height: height * 0.35,
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
});
