import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addComment } from "../services/commentService";
import { toggleLike } from "../services/postService";
import { savePost, unsavePost } from "../services/savedPostService";

export function usePostActions(postId: string, postNumericId?: number) {
  const qc = useQueryClient();

  const addCommentMutation = useMutation({
    mutationFn: ({ userId, body }: { userId: string; body: string }) =>
      addComment(postId, userId, body),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });

  const toggleLikeMutation = useMutation({
  mutationFn: ({ action }: { action: "like" | "unlike" }) =>
    toggleLike(postId, action),

  onSuccess: () => {
    qc.invalidateQueries({ queryKey: ["post", postId] });
  },
});
  const toggleSaveMutation = useMutation({
    mutationFn: ({
      userId,
      save,
    }: {
      userId: string;
      save: boolean;
    }) => {
      if (!postNumericId) {
        throw new Error("postNumericId is required for save/unsave");
      }

      return save
        ? savePost(userId, postNumericId)
        : unsavePost(userId, postNumericId);
    },

    onSuccess: (_, variables) => {
      const { userId } = variables;
      qc.invalidateQueries({ queryKey: ["savedPosts", userId] });
    },
  });

  return {
    addCommentMutation,
    toggleLikeMutation,
    toggleSaveMutation,
  };
}
