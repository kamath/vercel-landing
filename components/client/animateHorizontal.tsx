"use client";
import { motion, useTransform } from "framer-motion";
import { useContext } from "react";
import { ScrollContext } from "./page";

export default function AnimateHorizontalScroll({
  children,
  scroll,
  window = [0, 1],
}: {
  children: React.ReactNode;
  scroll: [number, number];
  window?: [number, number];
}) {
  const { scrollYProgress } = useContext(ScrollContext);

  const scrollX = useTransform(scrollYProgress, window, scroll);

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
