import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { useAuth } from "../../contexts/AuthContext";
import { RandomAvatar } from "../../components/RandomAvatar";
import { generateRandomUsername } from "../../utils/helpers";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CreateProfileScreen = () => {
  const { createProfile, signOut } = useAuth();
  const [username, setUsername] = useState(generateRandomUsername());
  const [avatarSeed, setAvatarSeed] = useState(
    Math.random().toString(36).slice(-8)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<NavigationProp>();

  const handleRandomize = () => {
    setUsername(generateRandomUsername());
    setAvatarSeed(Math.random().toString(36).slice(-8));
  };

  const handleCreateProfile = async () => {
    if (!username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createProfile(username.trim(), avatarSeed);
      if (!result) {
        throw new Error("Failed to create profile");
      }
      console.log("Profile created successfully:", {
        username,
        userId: result.id,
      });
      // AuthContext will handle navigation to MainTab
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Profile creation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
          <Icon name="logout" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Your Anonymous Profile</Text>

        <View style={styles.infoContainer}>
          <Icon name="incognito" size={24} color="#7C4DFF" />
          <Text style={styles.infoText}>
            Stay anonymous! Choose a username that doesn't reveal your real
            identity.
          </Text>
        </View>

        <View style={styles.avatarContainer}>
          <RandomAvatar seed={avatarSeed} size={120} />
          <TouchableOpacity
            style={styles.randomizeAvatarButton}
            onPress={() => setAvatarSeed(Math.random().toString(36).slice(-8))}
          >
            <Icon name="refresh" size={20} color="#fff" />
            <Text style={styles.randomizeButtonText}>New Avatar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Choose your username</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor="#666"
              maxLength={20}
            />
            <TouchableOpacity
              style={styles.randomizeUsernameButton}
              onPress={() => setUsername(generateRandomUsername())}
            >
              <Icon name="dice-multiple" size={20} color="#7C4DFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.guidelines}>
          <Text style={styles.guidelineTitle}>Keep in mind:</Text>
          <Text style={styles.guidelineText}>• Don't use your real name</Text>
          <Text style={styles.guidelineText}>
            • Avoid usernames from other platforms
          </Text>
          <Text style={styles.guidelineText}>• Be creative and unique</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[
            styles.createButton,
            !username.trim() && styles.createButtonDisabled,
          ]}
          onPress={handleCreateProfile}
          disabled={loading || !username.trim()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Create Profile</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#121212",
  },
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
  },
  infoText: {
    color: "#fff",
    marginLeft: 10,
    flex: 1,
    fontSize: 14,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  randomizeAvatarButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    padding: 8,
    backgroundColor: "#2A2A2A",
    borderRadius: 20,
  },
  randomizeButtonText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 14,
  },
  inputSection: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 8,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    padding: 15,
  },
  randomizeUsernameButton: {
    padding: 10,
  },
  guidelines: {
    width: "100%",
    backgroundColor: "#1E1E1E",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  guidelineTitle: {
    color: "#7C4DFF",
    fontSize: 16,
    marginBottom: 10,
  },
  guidelineText: {
    color: "#999",
    fontSize: 14,
    marginBottom: 5,
  },
  createButton: {
    backgroundColor: "#7C4DFF",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#4A4A4A",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#ff4444",
    marginBottom: 20,
    textAlign: "center",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
  },
  logoutButton: {
    padding: 8,
  },
});
