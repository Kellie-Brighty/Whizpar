import { supabase } from "../lib/supabase";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";

export const storageService = {
  uploadImage: async (uri: string): Promise<string | null> => {
    try {
      let base64;

      if (Platform.OS === "web") {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } else {
        // Read file as base64 and remove data URI prefix if present
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;
      const filePath = `posts/${fileName}.jpg`;

      // Convert base64 to Uint8Array directly
      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      const { data, error } = await supabase.storage
        .from("images")
        .upload(filePath, byteArray, {
          contentType: "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  },
};

// Helper function to decode base64
function decode(base64: string) {
  const byteCharacters = Buffer.from(base64, "base64").toString("binary");
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  return new Uint8Array(byteNumbers);
}
