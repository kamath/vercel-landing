"use client";
import { motion, useTransform } from "framer-motion";
import { useContext } from "react";
import { ScrollContext } from "./page";

export default function AnimateHorizontalScroll({
  children,
  scroll,
}: {
  children: React.ReactNode;
  scroll: [number, number];
}) {
  const { scrollYProgress } = useContext(ScrollContext);

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
