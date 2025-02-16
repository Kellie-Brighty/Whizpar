import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { PostType } from '../types';

interface PostState {
  posts: PostType[];
  loading: boolean;
  error: string | null;
}

type PostAction = 
  | { type: 'ADD_POST'; payload: PostType }
  | { type: 'SET_POSTS'; payload: PostType[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string };

const initialState: PostState = {
  posts: [],
  loading: false,
  error: null,
};

const postReducer = (state: PostState, action: PostAction): PostState => {
  switch (action.type) {
    case 'ADD_POST':
      return {
        ...state,
        posts: [action.payload, ...state.posts],
      };
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
};

const PostContext = createContext<{
  state: PostState;
  dispatch: React.Dispatch<PostAction>;
} | undefined>(undefined);

export const PostProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(postReducer, initialState);

  return (
    <PostContext.Provider value={{ state, dispatch }}>
      {children}
    </PostContext.Provider>
  );
};

export const usePost = () => {
  const context = useContext(PostContext);
  if (context === undefined) {
    throw new Error('usePost must be used within a PostProvider');
  }
  return context;
};