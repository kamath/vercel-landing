"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";

export function PinterestScroll({
  food,
  containerRef,
}: {
  food: string[];
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end start"],
  });

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="flex justify-center overflow-hidden w-full gap-4">
      <motion.div className="flex flex-col gap-4 mt-6" style={{ y: scrollY }}>
        {food
          .filter((_, index) => index % 2 === 0)
          .map((item: string, index: number) => (
            <div
              className="flex flex-col items-center gap-4 min-w-[150px]"
              key={index}
            >
              <div className="relative flex items-center justify-center aspect-square w-full bg-gray-200  overflow-hidden">
                <Image
                  src={`/img/food/${item}`}
                  alt="food"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          ))}
      </motion.div>
      <motion.div className="flex flex-col gap-4 mt-12">
        {food
          .filter((_, index) => index % 2 === 1)
          .map((item: string, index: number) => (
            <div
              className="flex flex-col items-center gap-4 min-w-[150px]"
              key={index}
            >
              <div className="relative flex items-center justify-center aspect-square w-full bg-gray-200  overflow-hidden">
                <Image
                  src={`/img/food/${item}`}
                  alt="food"
                  fill
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          ))}
      </motion.div>
    </div>
  );
}
