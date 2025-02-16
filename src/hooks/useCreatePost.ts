import { usePost } from '../context/PostContext';

export const useCreatePost = () => {
  const { dispatch } = usePost();

  const createPost = (content: string) => {
    const newPost = {
      id: Date.now().toString(),
      username: 'anonymous_user',
      content,
      createdAt: 'Just now',
    };

    dispatch({ type: 'ADD_POST', payload: newPost });
  };

  return { createPost };
};