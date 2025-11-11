import styles from "./About.module.css";

export default function AboutPage() {
  return (
    <div className={styles.panel}>
      <div className={styles.layout}>
        {/* שמאל */}
        <section className={styles.left}>
          <header className={`${styles.hero} ${styles.reveal}`} style={{ ['--d' as any]: '0ms' }}>
            <h1>who we are</h1>
            <p>
              MuseUP is an international community for artists and art lovers.
              Our vision is to connect inspiration, creativity and real people.
            </p>
          </header>

          <section className={styles.tasks}>
            <h2 className={`${styles.reveal}`} style={{ ['--d' as any]: '0ms' }}>Our tasks</h2>
            <ul className={styles.taskGrid}>
              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 1)' }}>
                <span className={`${styles.ico} ${styles.heart}`} aria-hidden>❤️</span>
                <strong>Create Inspiration</strong>
                <small>A place where every creator can share their work.</small>
              </li>
              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 2)' }}>
                <span className={`${styles.ico} ${styles.bolt}`} aria-hidden>⚡</span>
                <strong>Building a community</strong>
                <small>Artists from all over the world who support, learn and create together.</small>
              </li>
              <li className={`${styles.taskCard} ${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 3)' }}>
                <span className={`${styles.ico} ${styles.star}`} aria-hidden>⭐</span>
                <strong>Grow</strong>
                <small>Helping young artists turn passion into a real career.</small>
              </li>
            </ul>
          </section>

          <section className={styles.team}>
            <h3 className={`${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 4)' }}>The Team</h3>
            <ul className={styles.teamGrid}>
              <li className={`${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 5)' }}>
                <span className={styles.avatar} />
                <b>Michal</b>
                <small>The website developer</small>
              </li>
              <li className={`${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 6)' }}>
                <span className={styles.avatar} />
                <b>Tagil</b>
                <small>The website developer</small>
              </li>
              <li className={`${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 7)' }}>
                <span className={styles.avatar} />
                <b>Tami</b>
                <small>The website developer</small>
              </li>
            </ul>
          </section>
        </section>

        {/* קו אנכי */}
        <div className={styles.divider} aria-hidden />

        {/* ימין */}
        <aside className={styles.right}>
          <button className={`${styles.cta} ${styles.reveal}`} style={{ ['--d' as any]: '0ms' }}>
            Sigh Up
          </button>

          <div className={`${styles.illustration} ${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 1.5)' }} />

          <section className={`${styles.stats} ${styles.reveal}`} style={{ ['--d' as any]: 'calc(var(--rev-gap) * 3)' }}>
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
