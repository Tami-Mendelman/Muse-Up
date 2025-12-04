import { useEffect } from "react";

type Props = {
  autoFocusRef?: React.RefObject<HTMLInputElement>;
  emojiRef?: React.RefObject<HTMLDivElement>;
  shareRef?: React.RefObject<HTMLDivElement>;
  commentsRef?: React.RefObject<HTMLDivElement>;
  scrollDeps?: any[];
  onCloseEmoji?: () => void;
  onCloseShare?: () => void;
};

export default function useModalUI({
  autoFocusRef,
  emojiRef,
  shareRef,
  commentsRef,
  scrollDeps = [],
  onCloseEmoji,
  onCloseShare
}: Props) {
  
  // 1️⃣ Disable Scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // 2️⃣ Auto focus
  useEffect(() => {
    autoFocusRef?.current?.focus();
  }, []);

  // 3️⃣ Scroll To Bottom
  useEffect(() => {
    if (!commentsRef?.current) return;
    commentsRef.current.scrollTo({
      top: commentsRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, scrollDeps);

  // 4️⃣ Outside Click – Emoji + Share
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;

      // CLOSE EMOJI
      if (emojiRef?.current && !emojiRef.current.contains(target)) {
        onCloseEmoji?.();
      }

      // CLOSE SHARE
      if (shareRef?.current && !shareRef.current.contains(target)) {
        onCloseShare?.();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);

  }, [emojiRef, shareRef, onCloseEmoji, onCloseShare]);
}
