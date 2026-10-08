"use client";

import Image from "next/image";
import { MotionConfig, motion, type Variants } from "framer-motion";
import { flipkartProducts } from "./links";
import { AmazonButton, FlipkartButton } from "./marketplace-buttons";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/** `/shopnow`: the sale, with a way to shop it on Amazon or on Flipkart. */
export default function ShopNow() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {/* Drifting background blobs, as on the coming-soon page */}
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
          className="relative z-10 mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-5 py-14 text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="flex h-32 w-32 items-center justify-center rounded-full bg-white/80 shadow-xl shadow-deep/10 ring-1 ring-gold/20 sm:h-36 sm:w-36"
          >
            <Image
              src="/images/logo.png"
              alt="HairCraft"
              width={110}
              height={97}
              preload
              className="h-auto w-20 sm:w-24"
            />
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-8 rounded-full bg-deep px-5 py-2 text-[0.65rem] uppercase tracking-[0.3em] text-mint sm:text-xs"
          >
            Live sale · Limited time
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-6 text-balance font-display text-5xl font-light leading-[1.05] text-deep sm:text-6xl"
          >
            Shop our bestsellers,{" "}
            <em className="bg-gradient-to-r from-gold to-gold-light bg-clip-text italic text-transparent">
              on sale
            </em>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-sm text-base leading-relaxed text-deep/75"
          >
            Choose where you&apos;d like to shop: the same products at the same sale price.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex w-full max-w-md flex-col gap-3 rounded-[1.75rem] bg-white/80 p-4 shadow-xl shadow-deep/10 ring-1 ring-gold/20 backdrop-blur sm:p-5"
          >
            <AmazonButton />
            <FlipkartButton products={flipkartProducts} />
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="mt-9 flex items-center gap-4 whitespace-nowrap text-[0.65rem] uppercase tracking-[0.2em] text-deep-soft sm:text-xs sm:tracking-[0.25em]"
          >
            <span className="h-px w-6 bg-gold sm:w-10" />
            100% human hair · Free shipping over ₹999
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
