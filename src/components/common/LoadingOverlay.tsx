import React from 'react';
import { View, StyleSheet } from 'react-native';
import { CircularProgress } from './CircularProgress';

interface LoadingOverlayProps {
  progress: number;
}

export const LoadingOverlay = ({ progress }: LoadingOverlayProps) => (
  <View style={styles.container}>
    <CircularProgress progress={progress} size={50} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000,
  },
}); 