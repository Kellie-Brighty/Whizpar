import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  orderBy,
  where,
  onSnapshot,
  updateDoc,
  increment,
  deleteDoc,
  Timestamp,
  setDoc,
  limit,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Comment = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes: number;
  liked?: boolean;
  replies?: Array<{
    id: string;
    content: string;
    user_id: string;
    created_at: string;
    likes: number;
  }>;
};

export type Post = {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  image_url: string | null;
  likes: number;
  engagement: number;
  comment_count: number;
  username: string;
  avatar_seed: string;
  comments?: Comment[];
  view_count: number;
  report_count?: number;
  isViewable?: boolean;
};

interface CommentType {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  likes: number;
  parent_id: string | null;
}

export const postService = {
  createPost: async (content: string, userId: string, imageUrl?: string) => {
    try {
      // Get user profile
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      const postData = {
        content,
        user_id: userId,
        image_url: imageUrl || null,
        likes: 0,
        comment_count: 0,
        view_count: 0,
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'posts'), postData);

      const post: Post = {
        id: docRef.id,
        ...postData,
        created_at: new Date().toISOString(),
        username: userData?.username || 'Anonymous',
        avatar_seed: userData?.avatar_seed || 'default',
        engagement: 0,
      };

      return { post, error: null };
    } catch (error) {
      console.error('Error creating post:', error);
      return { post: null, error };
    }
  },

  getPosts: async (type: 'trending' | 'latest' = 'latest') => {
    try {
      const postsRef = collection(db, 'posts');
      let q;

      if (type === 'trending') {
        q = query(postsRef, orderBy('likes', 'desc'), limit(50));
      } else {
        q = query(postsRef, orderBy('created_at', 'desc'), limit(50));
      }

      const querySnapshot = await getDocs(q);
      const posts: Post[] = [];

      for (const docSnap of querySnapshot.docs) {
        const postData = docSnap.data();
        
        // Get user profile
        const userRef = doc(db, 'users', postData.user_id);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        // Get comments
        const commentsRef = collection(db, 'comments');
        const commentsQuery = query(
          commentsRef,
          where('post_id', '==', docSnap.id),
          orderBy('created_at', 'desc')
        );
        const commentsSnap = await getDocs(commentsQuery);
        
        const allComments = commentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        })) as CommentType[];

        const topLevelComments = allComments.filter(c => !c.parent_id);
        const replies = allComments.filter(c => c.parent_id);

        const commentsWithReplies = topLevelComments.map(comment => ({
          ...comment,
          replies: replies.filter(reply => reply.parent_id === comment.id),
        }));

        posts.push({
          id: docSnap.id,
          content: postData.content,
          user_id: postData.user_id,
          created_at: postData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          image_url: postData.image_url,
          likes: postData.likes || 0,
          comment_count: allComments.length,
          view_count: postData.view_count || 0,
          username: userData?.username || 'Anonymous',
          avatar_seed: userData?.avatar_seed || 'default',
          comments: commentsWithReplies as Comment[],
          engagement: (postData.likes || 0) + allComments.length * 2,
        });
      }

      if (type === 'trending') {
        posts.sort((a, b) => b.engagement - a.engagement);
      }

      return { posts, error: null };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { posts: null, error };
    }
  },

  getComments: async (postId: string) => {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('post_id', '==', postId),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const allComments = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      })) as CommentType[];

      const topLevelComments = allComments.filter(c => c.parent_id === null);
      const replies = allComments.filter(c => c.parent_id !== null);

      const commentsWithReplies = topLevelComments.map(comment => ({
        ...comment,
        replies: replies.filter(reply => reply.parent_id === comment.id) || [],
      }));

      return { comments: commentsWithReplies as Comment[], error: null };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { comments: null, error };
    }
  },

  subscribeToNewPosts: (callback: (post: Post) => void) => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('created_at', 'desc'), limit(1));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'added') {
          const postData = change.doc.data();
          
          // Get user profile
          const userRef = doc(db, 'users', postData.user_id);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();

          const post: Post = {
            id: change.doc.id,
            content: postData.content,
            user_id: postData.user_id,
            created_at: postData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            image_url: postData.image_url,
            likes: postData.likes || 0,
            comment_count: postData.comment_count || 0,
            view_count: postData.view_count || 0,
            username: userData?.username || 'Anonymous',
            avatar_seed: userData?.avatar_seed || 'default',
            engagement: 0,
          };

          callback(post);
        }
      }
    });

    return unsubscribe;
  },

  likePost: async (
    postId: string,
    userId: string
  ): Promise<{ success: boolean; error: any }> => {
    try {
      const likeRef = doc(db, 'post_likes', `${postId}_${userId}`);
      const likeSnap = await getDoc(likeRef);

      const postRef = doc(db, 'posts', postId);

      if (likeSnap.exists()) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likes: increment(-1),
        });
      } else {
        // Like
        await setDoc(likeRef, {
          post_id: postId,
          user_id: userId,
          created_at: Timestamp.now(),
        });
        await updateDoc(postRef, {
          likes: increment(1),
        });
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Error toggling like:', error);
      return { success: false, error };
    }
  },

  subscribeToPostEngagements: (callback: (post: Post) => void) => {
    console.log('Setting up post engagements subscription');

    const postsRef = collection(db, 'posts');
    
    const unsubscribe = onSnapshot(postsRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'modified') {
          const postData = change.doc.data();
          
          // Get user profile
          const userRef = doc(db, 'users', postData.user_id);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();

          const post: Post = {
            id: change.doc.id,
            content: postData.content,
            user_id: postData.user_id,
            created_at: postData.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
            image_url: postData.image_url,
            likes: postData.likes || 0,
            comment_count: postData.comment_count || 0,
            view_count: postData.view_count || 0,
            username: userData?.username || 'Anonymous',
            avatar_seed: userData?.avatar_seed || 'default',
            engagement: (postData.likes || 0) + (postData.comment_count || 0) * 2,
          };

          callback(post);
        }
      }
    });

    return unsubscribe;
  },

  registerView: async (postId: string, userId: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        view_count: increment(1),
      });

      return { error: null };
    } catch (error) {
      console.error('Error registering view:', error);
      return { error };
    }
  },

  createComment: async (postId: string, userId: string, content: string, parentId?: string | null) => {
    try {
      const commentData = {
        post_id: postId,
        user_id: userId,
        content,
        parent_id: parentId || null,
        likes: 0,
        created_at: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Update post comment count
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        comment_count: increment(1)
      });

      return { 
        comment: { id: docRef.id, ...commentData, created_at: new Date().toISOString() }, 
        error: null 
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return { comment: null, error };
    }
  },

  likeComment: async (commentId: string, userId: string) => {
     try {
      const likeRef = doc(db, 'comment_likes', `${commentId}_${userId}`);
      const likeSnap = await getDoc(likeRef);
      const commentRef = doc(db, 'comments', commentId);

      if (likeSnap.exists()) {
        await deleteDoc(likeRef);
         await updateDoc(commentRef, { likes: increment(-1) });
         return { liked: false, error: null };
      } else {
        await setDoc(likeRef, {
          comment_id: commentId,
          user_id: userId,
          created_at: Timestamp.now()
        });
        await updateDoc(commentRef, { likes: increment(1) });
        return { liked: true, error: null };
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      return { liked: false, error };
    }
  },

  editPost: async (postId: string, content: string) => {
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { content });
      return { success: true, error: null };
    } catch (error) {
      console.error('Error editing post:', error);
      return { success: false, error };
    }
  },

  deletePost: async (postId: string) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
      return { success: true, error: null };
    } catch (error) {
      console.error('Error deleting post:', error);
      return { success: false, error };
    }
  },

  reportPost: async (postId: string, userId: string): Promise<{ deleted: boolean; alreadyReported?: boolean; error: any }> => {
    try {
      const reportRef = doc(db, 'post_reports', `${postId}_${userId}`);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        return { deleted: false, alreadyReported: true, error: null };
      }

      await setDoc(reportRef, {
        post_id: postId,
        user_id: userId,
        created_at: Timestamp.now(),
      });

      const postRef = doc(db, 'posts', postId);
      
      // Increment report count
      await updateDoc(postRef, {
        report_count: increment(1)
      });

      // Check for auto-deletion
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const data = postSnap.data();
        if ((data.report_count || 0) >= 10) {
          await deleteDoc(postRef);
          return { deleted: true, error: null };
        }
      }

      return { deleted: false, error: null };
    } catch (error) {
      console.error('Error reporting post:', error);
      return { deleted: false, error };
    }
  }
};
