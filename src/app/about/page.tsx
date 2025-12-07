"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./About.module.css";

export default function AboutPage() {
  const illoRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const el = illoRef.current;
    if (!el) return;

    const onScroll = () => {
      const y = Math.min(12, window.scrollY / 20);
      el.style.transform = `translateY(${y}px)`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={styles.panel}>
      <div className={styles.layout}>
        
        {/* LEFT SIDE */}
        <section className={styles.left}>
          <header className={`${styles.hero} ${styles.reveal}`} style={{ ["--d" as any]: "0ms" }}>
            <h1>who we are</h1>
            <p>
              MuseUP is an international community for artists and art lovers.
              Our vision is to connect inspiration, creativity and real people.
            </p>
          </header>

          <section className={styles.tasks}>
            <h2 className={styles.reveal} style={{ ["--d" as any]: "0ms" }}>Our tasks</h2>

            <ul className={styles.taskGrid}>
              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ["--d" as any]: "calc(var(--rev-gap) * 1)" }}>
                <span className={`${styles.ico} ${styles.heart}`} aria-hidden>❤️</span>
                <strong>Create Inspiration</strong>
                <small>A place where every creator can share their work.</small>
              </li>

              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ["--d" as any]: "calc(var(--rev-gap) * 2)" }}>
                <span className={`${styles.ico} ${styles.bolt}`} aria-hidden>⚡</span>
                <strong>Building a community</strong>
                <small>Artists from all over the world who support, learn and create together.</small>
              </li>

              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ["--d" as any]: "calc(var(--rev-gap) * 3)" }}>
                <span className={`${styles.ico} ${styles.star}`} aria-hidden>⭐</span>
                <strong>Grow</strong>
                <small>Helping young artists turn passion into a real career.</small>
              </li>
            </ul>
          </section>

          <section className={styles.team}>
            <h3 className={styles.reveal} style={{ ["--d" as any]: "calc(var(--rev-gap) * 4)" }}>The Team</h3>

            <ul className={styles.teamGrid}>
              <li className={styles.reveal} style={{ ["--d" as any]: "calc(var(--rev-gap) * 5)" }}>
                <Image
                  src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1762782142/IMG_3905_v4lhhp.jpg"
                  alt="Michal"
                  width={72}
                  height={72}
                  className={styles.avatarImg}
                />
                <b>Michal</b>
                <small>The website developer</small>
              </li>

              <li className={styles.reveal} style={{ ["--d" as any]: "calc(var(--rev-gap) * 6)" }}>
                <Image
                  src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1762865435/AR_0860_fz6yrv.jpg"
                  alt="Tzipi"
                  width={72}
                  height={72}
                  className={styles.avatarImg}
                />
                <b>Tzipi</b>
                <small>The website developer</small>
              </li>

              <li className={styles.reveal} style={{ ["--d" as any]: "calc(var(--rev-gap) * 7)" }}>
                <Image
                  src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1762782134/IMG_4395_1_gmncyh.jpg"
                  alt="Tami"
                  width={72}
                  height={72}
                  className={styles.avatarImg}
                />
                <b>Tami</b>
                <small>The website developer</small>
              </li>
            </ul>
          </section>
        </section>

        <div className={styles.divider} aria-hidden />

        {/* RIGHT SIDE */}
        <aside className={styles.right}>
          
          {/* CHANGED BUTTON → now using global design system */}
          <button
            className={`btn btn-primary ${styles.reveal}`}
            style={{ ["--d" as any]: "0ms" }}
          >
            Sign Up
          </button>

          <Image
            ref={illoRef}
            src="https://res.cloudinary.com/dhxxlwa6n/image/upload/v1762853045/ChatGPT_Image_Nov_11_2025_11_21_39_AM_qnbqhw.png"
            alt="Artist painting illustration"
            width={400}
            height={260}
            className={`${styles.illustration} ${styles.parallax} ${styles.reveal}`}
            style={{ ["--d" as any]: "calc(var(--rev-gap) * 1.5)" }}
          />

          <section className={`${styles.stats} ${styles.reveal}`} style={{ ["--d" as any]: "calc(var(--rev-gap) * 3)" }}>
            <h4>MuseUP in number</h4>
            <ul>
              <li><span className={`${styles.pip} ${styles.orange}`} /> Uploaded works <b>10K+</b></li>
              <li><span className={`${styles.pip} ${styles.green}`} /> Active artists <b>8.5K</b></li>
              <li><span className={`${styles.pip} ${styles.red}`} /> Likes and shares <b>12K</b></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
