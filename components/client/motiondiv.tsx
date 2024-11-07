"use client";
import { motion, useScroll, useTransform } from "framer-motion";

export default function MotionDiv({
  children,
  containerRef,
  scroll,
}: {
  children: React.ReactNode;
  containerRef: React.RefObject<HTMLDivElement>;
  scroll: [number, number];
}) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end start"],
  });

  const scrollX = useTransform(scrollYProgress, [0, 1], scroll);

  return (
    <motion.div
      style={{ x: scrollX }}
      className="flex"
      onScroll={(e) => console.log(e.currentTarget.scrollLeft)}
    >
      {children}
    </motion.div>
  );
}
