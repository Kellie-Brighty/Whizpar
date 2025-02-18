import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { fonts } from "../../theme/fonts";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { CircularProgress } from "../common/CircularProgress";

interface PublicNudgeSheetProps {
  availableCoins: number;
  onSubmit: (data: {
    title: string;
    description: string;
    image?: string;
    duration: number;
  }) => Promise<void>;
}

const DURATIONS = [
  { days: 1, coins: 1000 },
  { days: 3, coins: 2500 },
  { days: 7, coins: 5000 },
];

export const PublicNudgeSheet = React.forwardRef<
  BottomSheetModal,
  PublicNudgeSheetProps
>(({ availableCoins, onSubmit }, ref) => {
  const bottomSheetRef = ref as React.RefObject<BottomSheetModal>;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const snapPoints = ["90%"];

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      alert("Sorry, we need camera roll permissions to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;

    try {
      await onSubmit({
        title,
        description,
        image: image || undefined,
        duration: selectedDuration.days,
      });

      setTitle("");
      setDescription("");
      setImage(null);
      bottomSheetRef.current?.close();
    } catch (error) {
      console.error("Error submitting nudge:", error);
    }
  };

  const canSubmit =
    title.trim() &&
    description.trim() &&
    availableCoins >= selectedDuration.coins;

  return (
    <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Public Nudge</Text>
            <Text style={styles.subtitle}>
              Promote your business anonymously
            </Text>
          </View>

          <View style={styles.balanceContainer}>
            <Icon name="currency-usd" size={24} color="#FFD700" />
            <Text style={styles.balanceText}>
              {availableCoins} Coins Available
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Business Name or Title"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={title}
              onChangeText={setTitle}
              maxLength={50}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Description (What are you promoting?)"
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              value={description}
              onChangeText={setDescription}
              maxLength={200}
            />

            <View style={styles.imageSection}>
              {image ? (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => setImage(null)}
                  >
                    <Icon name="close-circle" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePicker}
                  onPress={pickImage}
                >
                  <Icon name="image-plus" size={32} color="#7C4DFF" />
                  <Text style={styles.imagePickerText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.durationSection}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.durationOptions}>
                {DURATIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration.days}
                    style={[
                      styles.durationOption,
                      selectedDuration.days === duration.days &&
                        styles.selectedDuration,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text style={styles.durationDays}>
                      {duration.days} Day{duration.days > 1 ? "s" : ""}
                    </Text>
                    <View style={styles.coinAmount}>
                      <Icon name="currency-usd" size={16} color="#FFD700" />
                      <Text style={styles.coinText}>{duration.coins}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.submitButton,
              (!title.trim() ||
                !description.trim() ||
                availableCoins < selectedDuration.coins) &&
                styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={
              !title.trim() ||
              !description.trim() ||
              availableCoins < selectedDuration.coins
            }
          >
            <LinearGradient
              colors={["#7C4DFF", "#FF4D9C"]}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="currency-usd" size={20} color="#FFD700" />
              <Text style={styles.submitText}>
                Spend {selectedDuration.coins} Coins
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </BottomSheetView>
      </TouchableWithoutFeedback>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  balanceText: {
    fontFamily: fonts.semiBold,
    color: "#FFD700",
    fontSize: 16,
    marginLeft: 8,
  },
  form: {
    flex: 1,
    gap: 16,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontFamily: fonts.regular,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: "top",
  },
  imageSection: {
    height: 200,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePicker: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePickerText: {
    fontFamily: fonts.regular,
    color: "#7C4DFF",
    marginTop: 8,
  },
  imagePreview: {
    flex: 1,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  removeImage: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 12,
  },
  durationSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 12,
  },
  durationOptions: {
    flexDirection: "row",
    gap: 12,
  },
  durationOption: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  selectedDuration: {
    backgroundColor: "rgba(124, 77, 255, 0.2)",
    borderColor: "#7C4DFF",
    borderWidth: 1,
  },
  durationDays: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    marginBottom: 4,
  },
  coinAmount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  coinText: {
    fontFamily: fonts.semiBold,
    color: "#FFD700",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    overflow: "hidden",
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  submitText: {
    fontFamily: fonts.semiBold,
    color: "#FFFFFF",
    fontSize: 16,
  },
});
