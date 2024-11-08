"use client";
import { motion, useTransform } from "framer-motion";
import Image from "next/image";
import { ScrollContext } from "./page";
import { useContext, useRef } from "react";
import { cn } from "@/lib/utils";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
});

function FoodCard({
  item,
  index,
  food,
}: {
  item: { title: string; description: string; image: string };
  index: number;
  food: { title: string; description: string; image: string }[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const colIndex = index % 2;
  const rowIndex = index % 2 === 0 ? index / 2 : (index - 1) / 2;
  const descriptionIndex = colIndex % 2 === 0 ? index + 1 : index - 1;
  let changeOpacityOnScroll = false;
  if (colIndex % 2 === 0) changeOpacityOnScroll = rowIndex % 2 === 0;
  if (colIndex % 2 === 1) changeOpacityOnScroll = rowIndex % 2 === 1;
  return (
    <motion.div
      className="flex flex-col items-center gap-4 min-w-[150px]"
      key={index}
    >
      <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 1 }}
          whileInView={{ opacity: changeOpacityOnScroll ? 0 : 1 }}
          viewport={{
            amount: 1,
            margin: "0px 0px -40% 0px",
          }}
        >
          <Image
            src={`/img/food/${item.image}`}
            alt="food"
            fill
            className="rounded-lg object-cover"
          />
        </motion.div>
        <motion.div
          className={cn(
            "absolute inset-0 rounded-lg z-10 flex items-center justify-end text-right text-brown-500 text-xl",
            ebGaramond.className
          )}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: changeOpacityOnScroll ? 1 : 0 }}
          viewport={{
            amount: 1,
            margin: "40% 0px -40% 0px",
          }}
        >
          <div className="flex flex-col gap-2">
            <h1>{food[descriptionIndex].title}</h1>
            <p className="text-sm">{food[descriptionIndex].description}</p>
          </div>
        </motion.div>
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
              <FoodCard key={index} item={item} index={index * 2} food={food} />
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
                <FoodCard
                  key={index}
                  item={item}
                  index={index * 2 + 1}
                  food={food}
                />
              )
            )}
        </div>
      </motion.div>
    </div>
  );
}
