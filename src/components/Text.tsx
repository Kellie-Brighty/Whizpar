import { Text as RNText, TextProps } from 'react-native';
import React from 'react';

export const Text: React.FC<TextProps> = (props) => {
  return <RNText {...props} />;
}; 