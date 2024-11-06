"use client";
import { motion } from "framer-motion";

export default function MotionDiv() {
  return (
    <motion.div
      className="w-full h-full bg-blue-500"
      initial={{ scale: 0 }}
      animate={{ rotate: 180, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
    />
  );
}
