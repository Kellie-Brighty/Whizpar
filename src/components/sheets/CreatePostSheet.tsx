import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../../theme/fonts';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { CircularProgress } from '../common/CircularProgress';

interface CreatePostSheetProps {
  onPost: (content: string, image?: string) => Promise<void>;
}

export const CreatePostSheet = React.forwardRef<BottomSheetModal, CreatePostSheetProps>(
  ({ onPost }, ref) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [isPosting, setIsPosting] = useState(false);
    const [progress, setProgress] = useState(0);
    const bottomSheetRef = ref as React.RefObject<BottomSheetModal>;
    const snapPoints = ['70%'];

    const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setImage(result.assets[0].uri);
      }
    };

    const handlePost = async () => {
      if (content.trim()) {
        setIsPosting(true);
        setProgress(0);

        // Simulate upload progress for 5 seconds
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 95) {
              clearInterval(interval);
              return prev;
            }
            return prev + 5;
          });
        }, 250);

        try {
          await onPost(content, image || undefined);
          setProgress(100);
          
          setTimeout(() => {
            setIsPosting(false);
            setProgress(0);
            setContent('');
            setImage(null);
            bottomSheetRef.current?.close();
          }, 500);
        } catch (error) {
          console.error('Error posting:', error);
          setIsPosting(false);
          setProgress(0);
        }
        clearInterval(interval);
      }
    };

    return (
      <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Whisper</Text>
            <Text style={styles.subtitle}>Share your thoughts anonymously</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, image && styles.inputWithImage]}
              placeholder="What's on your mind?"
              placeholderTextColor="rgba(255,255,255,0.5)"
              multiline
              value={content}
              onChangeText={setContent}
              maxLength={500}
            />
            
            {image && (
              <View style={styles.imagePreview}>
                <Image source={{ uri: image }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={styles.removeImage}
                  onPress={() => setImage(null)}
                >
                  <Icon name="close-circle" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
            
            <Text style={styles.charCount}>{content.length}/500</Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
              <Icon name="image-plus" size={24} color="#7C4DFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.postButton, !content.trim() && styles.postButtonDisabled]}
              onPress={handlePost}
              disabled={!content.trim() || isPosting}
            >
              <LinearGradient
                colors={['#7C4DFF', '#FF4D9C']}
                style={styles.postGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isPosting ? (
                  <View style={styles.loadingContainer}>
                    <CircularProgress progress={progress} size={24} />
                  </View>
                ) : (
                  <>
                    <Icon name="send" size={20} color="#FFFFFF" />
                    <Text style={styles.postButtonText}>Post Whisper</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  inputContainer: {
    flex: 1,
    marginBottom: 16,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#FFFFFF',
    minHeight: 120,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'right',
    marginTop: 8,
  },
  postButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  postButtonText: {
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  inputWithImage: {
    maxHeight: 100,
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeImage: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  imageButton: {
    padding: 8,
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    borderRadius: 8,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
}); 