import React, { forwardRef } from "react";
import { View, StyleSheet, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { Post } from "../posts/Post";
import { Post as PostType } from "../../services/postService";
import { fonts } from "../../theme/fonts";

interface AllWhispersSheetProps {
  posts: PostType[];
  user: any;
}

export const AllWhispersSheet = forwardRef<
  BottomSheetModal,
  AllWhispersSheetProps
>(({ posts, user }, ref) => {
  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={["95%"]}
      // backgroundStyle={styles.background}
      // handleIndicatorStyle={styles.indicator}
      enablePanDownToClose
      index={0}
    >
      <BottomSheetView style={styles.container}>
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          <Text style={styles.title}>All Whispers</Text>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {posts.map((post) => (
              <Post key={post.id} post={post} user={user} />
            ))}
          </ScrollView>
        </SafeAreaView>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: fonts.semiBold,
    margin: 16,
  },
});
