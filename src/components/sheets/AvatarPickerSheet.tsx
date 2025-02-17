import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { fonts } from '../../theme/fonts';
import { RandomAvatar } from '../RandomAvatar';
import Animated, { FadeIn } from 'react-native-reanimated';

interface AvatarPickerSheetProps {
  onSelect: (seed: string) => void;
  selectedSeed: string;
}

export const AvatarPickerSheet = React.forwardRef<BottomSheetModal, AvatarPickerSheetProps>(
  ({ onSelect, selectedSeed }, ref) => {
    const snapPoints = ['85%'];
    const avatarSeeds = Array.from({ length: 20 }, () =>
      Math.random().toString(36).substring(7)
    );

    return (
      <BottomSheetModal ref={ref} snapPoints={snapPoints} enablePanDownToClose>
        <BottomSheetView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Avatar</Text>
            <Text style={styles.subtitle}>Select your anonymous identity</Text>
          </View>

          <View style={styles.previewContainer}>
            <Animated.View entering={FadeIn} style={styles.preview}>
              <RandomAvatar seed={selectedSeed} />
            </Animated.View>
            <Text style={styles.previewText}>Current Avatar</Text>
          </View>

          <FlatList
            data={avatarSeeds}
            numColumns={3}
            contentContainerStyle={styles.gridContainer}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.avatarItem,
                  selectedSeed === item && styles.selectedItem
                ]}
                onPress={() => onSelect(item)}
              >
                <RandomAvatar seed={item} />
                {selectedSeed === item && (
                  <View style={styles.checkmark}>
                    <Icon name="check-circle" size={24} color="#7C4DFF" />
                  </View>
                )}
              </TouchableOpacity>
            )}
          />
        </BottomSheetView>
      </BottomSheetModal>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  previewContainer: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
  },
  preview: {
    marginBottom: 12,
  },
  previewText: {
    fontFamily: fonts.semiBold,
    color: '#FFFFFF',
    fontSize: 16,
  },
  gridContainer: {
    padding: 16,
  },
  avatarItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 8,
    position: 'relative',
  },
  selectedItem: {
    backgroundColor: 'rgba(124, 77, 255, 0.1)',
    borderRadius: 16,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
}); 