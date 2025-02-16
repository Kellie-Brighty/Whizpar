import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PostType } from '../../types';

interface PostsState {
  posts: PostType[];
  loading: boolean;
  error: string | null;
}

const initialState: PostsState = {
  posts: [],
  loading: false,
  error: null,
};

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    addPost: (state, action: PayloadAction<PostType>) => {
      state.posts.unshift(action.payload);
    },
    setPosts: (state, action: PayloadAction<PostType[]>) => {
      state.posts = action.payload;
    },
  },
});

export const { addPost, setPosts } = postsSlice.actions;
export default postsSlice.reducer;