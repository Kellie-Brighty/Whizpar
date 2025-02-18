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

export interface PublicNudge {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  daysLeft: number;
  impressions: number;
  createdAt: string;
} 