import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { useCreatePost } from '../../hooks/useCreatePost';
import { useNavigation } from '@react-navigation/native';

export const CreatePostScreen = () => {
  const [content, setContent] = useState('');
  const { createPost } = useCreatePost();
  const navigation = useNavigation();

  const handleSubmit = () => {
    if (content.trim()) {
      createPost(content);
      setContent('');
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        mode="outlined"
        placeholder="What's happening?"
        value={content}
        onChangeText={setContent}
      />
      <Button 
        mode="contained" 
        onPress={handleSubmit}
        disabled={!content.trim()}
      >
        Post
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    marginBottom: 16,
    height: 150,
  },
});