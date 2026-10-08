"use client";

import Image from "next/image";
import Link from "next/link";
import { MotionConfig, motion, type Variants } from "framer-motion";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

export default function ComingSoon() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Drifting background blobs */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-mint-deep blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-gold/25 blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-48 w-48 items-center justify-center rounded-full bg-white/80 shadow-xl shadow-deep/10 ring-1 ring-gold/20 sm:h-60 sm:w-60"
            >
              <h1>
                <Image
                  src="/images/logo.png"
                  alt="HairCraft"
                  width={1240}
                  height={1088}
                  preload
                  className="h-auto w-32 sm:w-44"
                />
              </h1>
            </motion.div>
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-10 rounded-full bg-deep px-5 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-mint sm:text-xs"
          >
            HairCraft · Launching soon
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-6 font-display text-6xl font-light leading-none text-deep sm:text-8xl"
          >
            Coming{" "}
            <em className="bg-gradient-to-r from-gold to-gold-light bg-clip-text italic text-transparent">
              soon
            </em>
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-md text-base leading-relaxed text-deep/70 sm:text-lg"
          >
            Premium hair extensions, thoughtfully crafted for length, volume and
            confidence. Our store opens its doors very soon.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8">
            <Link
              href="/shopnow"
              className="group inline-flex min-h-12 items-center gap-3 rounded-full bg-deep px-7 py-3 text-sm font-medium tracking-wide text-mint shadow-lg shadow-deep/15 transition hover:bg-deep-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep active:scale-[0.98] sm:text-base"
            >
              Shop now on marketplace
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5 text-gold-light transition-transform duration-200 group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex items-center gap-4 whitespace-nowrap text-[0.65rem] uppercase tracking-[0.2em] text-deep-soft sm:text-xs sm:tracking-[0.3em]"
          >
            <span className="h-px w-6 bg-gold sm:w-10" />
            Length · Volume · Confidence
            <span className="h-px w-6 bg-gold sm:w-10" />
          </motion.div>
        </motion.section>

        <footer className="relative z-10 bg-deep px-6 py-5 text-center text-xs text-mint/80">
          © {new Date().getFullYear()} Hair Craft. All rights reserved.
        </footer>
      </main>
    </MotionConfig>
  );
}
