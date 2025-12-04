"use client";

import "../globals.css";
import { useState, ChangeEvent, FormEvent, MouseEvent } from "react";
import styles from "./profile.module.css";
import AvatarCropper from "../components/CropImage/CropImage";
import PostModal from "../components/PostModal/PostModal";
import { Pencil, Trash2 } from "lucide-react";
import { useProfilePage } from "../../hooks/useProfilePage";
export default function ProfilePage() {
  const {
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
    followers,
    loadingFollowers,
    following,
    loadingFollowing,
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
  } = useProfilePage();
  if (!uidReady)
    return <div className={styles.page}>Loading profile…</div>;
  if (!uid)
    return (
      <div className={styles.page}>
        <p>No logged-in user. Please sign in.</p>
      </div>
    );
  if (loadingUser)
    return <div className={styles.page}>Loading profile…</div>;
  if (userError || !user)
    return (
      <div className={styles.page}>
        <p>Failed to load profile.</p>
      </div>
    );
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatarWrapper}>
          {user.profil_url ? (
            <img
              src={user.profil_url}
              alt={user.name ?? user.username}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarFallback}>
              {user.username?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className={styles.headerText}>
          <h1 className={styles.name}>
            {user.name ?? user.username}
          </h1>
          <div className={styles.metaRow}>
            <button
              type="button"
              className={styles.metaItemButton}
              onClick={() => setActiveTab("followers")}
            >
              {(user.followers_count ?? 0).toLocaleString()} followers
            </button>
            <span className={styles.divider}>|</span>
            <button
              type="button"
              className={styles.metaItemButton}
              onClick={() => setActiveTab("following")}
            >
              {(user.following_count ?? 0).toLocaleString()} following
            </button>
          </div>
          {user.bio && (
            <p className={styles.bio}>{user.bio}</p>
          )}
          {user.location && (
            <p className={styles.location}>{user.location}</p>
          )}
        </div>
      </header>
      <nav className={styles.tabs}>
        {[
          ["posts", "My Posts"],
          ["saved", "Saved"],
          ["challenge", "Challenge"],
          ["edit", "Edit"],
        ].map(([key, label]) => (
          <button
            key={key}
            className={`${styles.tab} ${
              activeTab === key ? styles.tabActive : ""
            }`}
            onClick={() => setActiveTab(key as any)}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className={styles.content}>
        {activeTab === "posts" && (
          <div className={styles.postsSection}>
            <button
              className={styles.shareArtBtn}
              onClick={goToCreate}
            >
              share your art{" "}
              <span className={styles.sharePlus}>+</span>
            </button>
            {loadingPosts && <p>Loading posts…</p>}
            {postsError && <p>Failed to load posts.</p>}
            {!loadingPosts && posts.length === 0 && (
              <p className={styles.placeholder}>No posts yet.</p>
            )}
            {!loadingPosts && posts.length > 0 && (
              <div className={styles.postsGrid}>
                {posts.map((p) => (
                  <div
                    key={p._id}
                    className={styles.postCard}
                    onClick={() =>
                      p.id != null &&
                      setSelectedPostId(p.id)
                    }
                  >
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className={styles.postImage}
                    />
                    <div className={styles.postActions}>
                      <button
                        className={styles.postActionBtn}
                        onClick={(e) =>
                          handleEditPost(e, p._id)
                        }
                      >
                        <Pencil
                          size={18}
                          className={styles.icon}
                        />
                      </button>
                      <button
                        className={styles.postActionBtn}
                        onClick={(e) =>
                          handleDeletePostClick(e, p._id)
                        }
                      >
                        <Trash2
                          size={18}
                          className={styles.iconDelete}
                        />
                      </button>
                    </div>
                    <div className={styles.postInfo}>
                      <h3 className={styles.postTitle}>
                        {p.title}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === "saved" && (
          <div className={styles.postsSection}>
            {loadingSaved && <p>Loading saved posts…</p>}
            {savedError && (
              <p>Failed to load saved posts.</p>
            )}
            {!loadingSaved &&
              savedPosts.length === 0 && (
                <p>No saved posts yet.</p>
              )}
            {!loadingSaved &&
              savedPosts.length > 0 && (
                <div className={styles.postsGrid}>
                  {savedPosts.map((p) => (
                    <div
                      key={p._id}
                      className={styles.postCard}
                      onClick={() =>
                        setSelectedPostId(p.id)
                      }
                    >
                      <img
                        src={p.image_url}
                        alt={p.title}
                        className={styles.postImage}
                      />
                      <div className={styles.postInfo}>
                        <h3 className={styles.postTitle}>
                          {p.title}
                        </h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}
        {activeTab === "challenge" && (
          <div className={styles.postsSection}>
            {(loadingJoinedChallenges ||
              loadingAllChallenges) && (
              <p>Loading your challenges…</p>
            )}
            {!loadingJoinedChallenges &&
              !loadingAllChallenges &&
              joinedChallengesWithDetails.length ===
                0 && (
                <p>
                  You haven&apos;t joined any challenges
                  yet.
                </p>
              )}
            {!loadingJoinedChallenges &&
              !loadingAllChallenges &&
              joinedChallengesWithDetails.length > 0 && (
                <div className={styles.challengesGrid}>
                  {joinedChallengesWithDetails.map(
                    ({ submission, challenge }) => {
                      const ch = challenge as any as {
                        id: number;
                        title: string;
                        picture_url?: string;
                        status?: string;
                        end_date?: string;
                      };

                      const isActive =
                        ch.status === "active" ||
                        !ch.end_date ||
                        new Date(ch.end_date) >
                          new Date();

                      const isSubmitted =
                        submission.status ===
                          "submitted" ||
                        !!submission.image_url;

                      return (
                        <div
                          key={submission._id}
                          className={styles.challengeCard}
                        >
                          {ch.picture_url && (
                            <img
                              src={ch.picture_url}
                              alt={ch.title}
                              className={
                                styles.challengeImage
                              }
                            />
                          )}

                          <h3
                            className={
                              styles.challengeTitle
                            }
                          >
                            {ch.title}
                          </h3>

                          <p
                            className={
                              styles.challengeStatus
                            }
                          >
                            Status:{" "}
                            {isActive
                              ? "Active"
                              : "Finished"}
                          </p>

                          <div
                            className={
                              styles.challengeActions
                            }
                          >
                            {isActive &&
                              !isSubmitted && (
                                <>
                                  <button
                                    className={
                                      styles.challengeUploadBtn
                                    }
                                    disabled={
                                      uploadingChallengeId ===
                                      ch.id
                                    }
                                    onClick={() =>
                                      document
                                        .getElementById(
                                          `upload-${ch.id}`
                                        )
                                        ?.click()
                                    }
                                  >
                                    {uploadingChallengeId ===
                                    ch.id
                                      ? "Uploading..."
                                      : "Upload your art"}
                                  </button>

                                  <input
                                    id={`upload-${ch.id}`}
                                    type="file"
                                    accept="image/*"
                                    style={{
                                      display: "none",
                                    }}
                                    onChange={(e) => {
                                      const file =
                                        e.target
                                          .files?.[0];
                                      if (!file)
                                        return;
                                      setUploadingChallengeId(
                                        ch.id
                                      );
                                      uploadChallengeMutation.mutate(
                                        {
                                          challengeId:
                                            ch.id,
                                          file,
                                        },
                                        {
                                          onSettled:
                                            () => {
                                              setUploadingChallengeId(
                                                null
                                              );
                                              e.target.value =
                                                "";
                                            },
                                        }
                                      );
                                    }}
                                  />
                                </>
                              )}
                            {isSubmitted && (
                              <span
                                className={
                                  styles.submittedText
                                }
                              >
                                You already submitted.
                              </span>
                            )}

                            {isActive && (
                              <button
                                className={
                                  styles.challengeLeaveBtn
                                }
                                onClick={() =>
                                  leaveChallengeMutation.mutate(
                                    ch.id
                                  )
                                }
                              >
                                Leave challenge
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
          </div>
        )}
        {activeTab === "edit" && (
          <form
            className={styles.editForm}
            onSubmit={handleSaveProfile}
          >
            <div className={styles.editGrid}>
              <div className={styles.editLeft}>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>
                    Name
                  </label>
                  <input
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    className={styles.editInput}
                  />
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>
                    Username
                  </label>
                  <input
                    name="username"
                    value={editForm.username}
                    onChange={handleEditChange}
                    className={styles.editInput}
                  />
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    className={styles.editTextarea}
                    rows={4}
                  />
                </div>
                <div className={styles.editField}>
                  <label className={styles.editLabel}>
                    Location
                  </label>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    className={styles.editInput}
                  />
                </div>
              </div>
              <div className={styles.editRight}>
                <p className={styles.editLabel}>
                  Profile picture
                </p>
                <div className={styles.editAvatarWrapper}>
                  {editForm.profil_url ? (
                    <img
                      src={editForm.profil_url}
                      className={styles.editAvatarImg}
                    />
                  ) : (
                    <div className={styles.editAvatarFallback}>
                      {user.username?.charAt(0)}
                    </div>
                  )}
                </div>
                <label className={styles.editUploadBtn}>
                  {uploadingAvatar
                    ? "Uploading…"
                    : "Change profile picture"}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleAvatarInputChange}
                  />
                </label>
              </div>
            </div>
            {saveError && (
              <p className={styles.editError}>{saveError}</p>
            )}
            {saveSuccess && (
              <p className={styles.editSuccess}>
                Profile updated!
              </p>
            )}
            <div className={styles.editActions}>
              <button
                type="submit"
                className={styles.editPrimaryBtn}
                disabled={savingProfile}
              >
                {savingProfile
                  ? "Saving…"
                  : "Save changes"}
              </button>
            </div>
          </form>
        )}
        {activeTab === "followers" && (
          <div className={styles.followersSection}>
            <h2>Followers</h2>
            {!loadingFollowers &&
              followers.length === 0 && (
                <p>No followers yet.</p>
              )}
            <div className={styles.followersGrid}>
              {followers.map((f) => (
                <div
                  key={f._id}
                  className={styles.followerCard}
                >
                  <img
                    src={f.profil_url || ""}
                    className={styles.followerAvatar}
                  />
                  <div>
                    <div
                      className={styles.followerName}
                    >
                      {f.name ?? f.username}
                    </div>
                    <div
                      className={
                        styles.followerUsername
                      }
                    >
                      @{f.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "following" && (
          <div className={styles.followersSection}>
            <h2>Following</h2>
            {!loadingFollowing &&
              following.length === 0 && (
                <p>Not following anyone.</p>
              )}
            <div className={styles.followersGrid}>
              {following.map((f) => (
                <div
                  key={f._id}
                  className={styles.followerCard}
                >
                  <img
                    src={f.profil_url || ""}
                    className={styles.followerAvatar}
                  />
                  <div>
                    <div
                      className={styles.followerName}
                    >
                      {f.name ?? f.username}
                    </div>
                    <div
                      className={
                        styles.followerUsername
                      }
                    >
                      @{f.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedPostId && (
        <PostModal
          postId={String(selectedPostId)}
          onClose={() => setSelectedPostId(null)}
        />
      )}
      {deletePostId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h3>Delete this post?</h3>
            <p>This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                onClick={() => setDeletePostId(null)}
              >
                Cancel
              </button>
              <button
                className={styles.modalConfirm}
                onClick={confirmDeletePost}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {avatarFileToCrop && (
        <AvatarCropper
          imageFile={avatarFileToCrop}
          onUpload={handleCroppedAvatarUpload}
          onCancel={() => setAvatarFileToCrop(null)}
        />
      )}
    </div>
  );
}
