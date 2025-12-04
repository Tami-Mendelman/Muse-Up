"use client";

import {
  useState,
  ChangeEvent,
  FormEvent,
  MouseEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  useQuery,
  useQueryClient,
  useMutation,
} from "@tanstack/react-query";

import { useFirebaseUid } from "./useFirebaseUid";
import {
  useProfileEditForm,
  type EditFormState,
} from "./useProfileEditForm";

import {
  getUserByUid,
  updateUserProfile,
  type User,
  type UpdateUserPayload,
} from "../services/userService";
import {
  getUserPosts,
  deletePost,
  type PostCard,
} from "../services/postService";
import {
  getFollowersForUser,
  getFollowingForUser,
  type SimpleUser,
} from "../services/followService";
import { uploadAvatar } from "../services/uploadService";
import { getSavedPosts } from "../services/savedPostService";
import { getChallenges } from "../services/challengesService";
import {
  getUserJoinedChallenges,
  leaveChallenge,
  submitChallengeImage,
} from "../services/challengeSubmissionsService";
export type TabKey =
  | "posts"
  | "saved"
  | "collections"
  | "challenge"
  | "edit"
  | "followers"
  | "following";
type Challenge = {
  _id: string;
  id: number;
  title: string;
  description?: string;
  picture_url?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
};
type ChallengeSubmission = {
  _id: string;
  challenge_id: number;
  user_id: number;
  status?: string;
  image_url?: string | null;
};
export function useProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>("posts");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [avatarFileToCrop, setAvatarFileToCrop] =
    useState<File | null>(null);
  const [uploadingChallengeId, setUploadingChallengeId] =
    useState<number | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(
    null
  );
  const [deletePostId, setDeletePostId] = useState<string | null>(
    null
  );
  const { uid, ready: uidReady } = useFirebaseUid();
  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["user", uid],
    queryFn: () => getUserByUid(uid as string),
    enabled: uidReady && !!uid,
  });
  const { form: editForm, setForm: setEditForm } =
    useProfileEditForm(user ?? null);
  const {
    data: posts = [],
    isLoading: loadingPosts,
    error: postsError,
  } = useQuery<PostCard[]>({
    queryKey: ["posts", user?.firebase_uid],
    enabled: !!user?.firebase_uid && activeTab === "posts",
    queryFn: async () => {
      if (!user || !user.firebase_uid) return [];
      const result = await getUserPosts(user.firebase_uid);
      return result;
    },
  });
  const {
    data: savedPosts = [],
    isLoading: loadingSaved,
    error: savedError,
  } = useQuery<PostCard[]>({
    queryKey: ["savedPosts", uid],
    queryFn: () => getSavedPosts(uid!),
    enabled: !!uid && activeTab === "saved",
  });
  const {
    data: joinedSubmissions = [],
    isLoading: loadingJoinedChallenges,
    error: joinedChallengesError,
  } = useQuery<ChallengeSubmission[]>({
    queryKey: ["joinedChallenges", user?.firebase_uid],
    queryFn: () => getUserJoinedChallenges(user!.firebase_uid),
    enabled: !!user && activeTab === "challenge",
  });
  const {
    data: challenges = [],
    isLoading: loadingAllChallenges,
    error: allChallengesError,
  } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => getChallenges(),
    enabled: !!user && activeTab === "challenge",
  });
  const leaveChallengeMutation = useMutation({
    mutationFn: (challengeId: number) =>
      leaveChallenge(challengeId, user!.firebase_uid),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["joinedChallenges", user?.firebase_uid],
      });
    },
  });
  const uploadChallengeMutation = useMutation({
    mutationFn: ({
      challengeId,
      file,
    }: {
      challengeId: number;
      file: File;
    }) =>
      submitChallengeImage(challengeId, user!.firebase_uid, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["joinedChallenges", user?.firebase_uid],
      });
    },
  });
  const deletePostMutation = useMutation({
    mutationFn: (postId: string) => deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["posts", user?.firebase_uid],
      });
    },
  });
  const joinedChallengesWithDetails =
    joinedSubmissions && challenges
      ? joinedSubmissions
          .map((sub) => ({
            submission: sub,
            challenge: challenges.find(
              (c) => c.id === sub.challenge_id
            ),
          }))
          .filter((x) => x.challenge !== undefined)
      : [];
  const {
    data: followers = [],
    isLoading: loadingFollowers,
    error: followersError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["followers", user?.firebase_uid],
    queryFn: () => getFollowersForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "followers",
  });
  const {
    data: following = [],
    isLoading: loadingFollowing,
    error: followingError,
  } = useQuery<SimpleUser[]>({
    queryKey: ["following", user?.firebase_uid],
    queryFn: () => getFollowingForUser(user!.firebase_uid),
    enabled: !!user && activeTab === "following",
  });
  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEditForm((prev: EditFormState) => ({
      ...prev,
      [name]: value,
    }));
  }
  async function handleAvatarInputChange(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFileToCrop(file);
    setSaveError(null);
    setSaveSuccess(false);
  }
  const handleCroppedAvatarUpload = async (croppedFile: File) => {
    try {
      setUploadingAvatar(true);
      const url = await uploadAvatar(croppedFile);
      setEditForm((prev: EditFormState) => ({
        ...prev,
        profil_url: url,
      }));
      queryClient.setQueryData<User>(["user", uid], (old) =>
        old ? { ...old, profil_url: url } : old
      );
    } catch (err) {
      console.error("Failed to upload avatar", err);
      setSaveError("Upload failed. Please try again.");
    } finally {
      setUploadingAvatar(false);
      setAvatarFileToCrop(null);
    }
  };
  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const payload: UpdateUserPayload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
        location: editForm.location.trim(),
        profil_url: editForm.profil_url,
      };
      const updated = await updateUserProfile(
        user.firebase_uid,
        payload
      );
      queryClient.setQueryData<User>(["user", uid], updated);
      setSaveSuccess(true);
    } catch (err) {
      console.error(err);
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }
  function handleDeletePostClick(
    e: MouseEvent,
    postId: string
  ) {
    e.stopPropagation();
    setDeletePostId(postId);
  }
  async function confirmDeletePost() {
    if (!deletePostId) return;
    try {
      await deletePostMutation.mutateAsync(deletePostId);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeletePostId(null);
    }
  }
  function handleEditPost(e: MouseEvent, postId: string) {
    e.stopPropagation();
    router.push(`/edit-post/${postId}`);
  }
  function goToCreate() {
    router.push("/create");
  }
  return {
    uidReady,
    uid,
    user,
    loadingUser,
    userError,
    activeTab,
    setActiveTab,
    savingProfile,
    uploadingAvatar,
    saveError,
    saveSuccess,
    avatarFileToCrop,
    setAvatarFileToCrop,
    uploadingChallengeId,
    setUploadingChallengeId,
    selectedPostId,
    setSelectedPostId,
    deletePostId,
    setDeletePostId,
    posts,
    loadingPosts,
    postsError,
    savedPosts,
    loadingSaved,
    savedError,
    joinedChallengesWithDetails,
    loadingJoinedChallenges,
    loadingAllChallenges,
    joinedChallengesError,
    allChallengesError,
    followers,
    loadingFollowers,
    followersError,
    following,
    loadingFollowing,
    followingError,
    leaveChallengeMutation,
    uploadChallengeMutation,
    editForm,
    handleEditChange,
    handleAvatarInputChange,
    handleCroppedAvatarUpload,
    handleSaveProfile,
    handleDeletePostClick,
    confirmDeletePost,
    handleEditPost,
    goToCreate,
  };
}
