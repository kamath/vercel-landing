"use client";
import { motion, useTransform } from "framer-motion";
import Image from "next/image";
import { ScrollContext } from "./page";
import { useContext, useRef } from "react";

function FoodCard({
  item,
  index,
}: {
  item: { title: string; description: string; image: string };
  index: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      className="flex flex-col items-center gap-4 min-w-[150px]"
      key={index}
    >
      <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden">
        <Image
          src={`/img/food/${item.image}`}
          alt="food"
          fill
          className="rounded-lg object-cover"
        />
        <div
          className="absolute h-[100px] w-full"
          ref={scrollRef}
          style={{ top: "-50px" }}
        />
      </div>
    </motion.div>
  );
}

export function PinterestScroll({
  food,
}: {
  food: {
    title: string;
    description: string;
    image: string;
  }[];
}) {
  const { scrollYProgress } = useContext(ScrollContext);

  const scrollY = useTransform(scrollYProgress, [0, 1], [0, -100], {
    clamp: false,
  });

  return (
    <div className="flex justify-center overflow-hidden w-full gap-4">
      <motion.div
        className="flex flex-col gap-4 mt-12 relative"
        style={{ y: scrollY }}
      >
        {food
          .filter((_, index) => index % 2 === 0)
          .map(
            (
              item: { title: string; description: string; image: string },
              index: number
            ) => (
              <FoodCard key={index} item={item} index={index * 2} />
            )
          )}
      </motion.div>
      <motion.div className="flex flex-col gap-4 mt-8 relative">
        <div className="flex flex-col gap-4">
          {food
            .filter((_, index) => index % 2 === 1)
            .map(
              (
                item: { title: string; description: string; image: string },
                index: number
              ) => (
                <FoodCard key={index} item={item} index={index * 2 + 1} />
              )
            )}
        </div>
      </motion.div>
    </div>
  );
}
