import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

const IMGBB_API_KEY = process.env.EXPO_PUBLIC_IMGBB_API_KEY || '';
const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';

export const storageService = {
  uploadImage: async (uri: string): Promise<string | null> => {
    try {
      let base64;

      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
        // Remove data URI prefix
        base64 = base64.split(',')[1];
      } else {
        // Read file as base64
        base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Upload to ImgBB
      const formData = new FormData();
      formData.append('key', IMGBB_API_KEY);
      formData.append('image', base64);

      const response = await fetch(IMGBB_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error?.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  },
};

