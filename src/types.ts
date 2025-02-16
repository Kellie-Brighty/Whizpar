export interface PostType {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  type: "text" | "image";
  likes: number;
  comments: CommentType[];
  imageUrl?: string;
}

export interface CommentType {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  likes: number;
  replies: CommentType[];
} 