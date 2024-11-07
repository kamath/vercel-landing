"use client";
import { motion, useTransform } from "framer-motion";
import Image from "next/image";
import { ScrollContext } from "./page";
import { useContext } from "react";
import { cn } from "@/lib/utils";
import { EB_Garamond } from "next/font/google";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "700"],
});

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

  const div1Opacity = useTransform(scrollYProgress, [0, 0.05], [0, 1]);
  const div2Opacity = useTransform(scrollYProgress, [0.05, 0.1], [0, 1]);
  const div3Opacity = useTransform(scrollYProgress, [0.1, 0.15], [0, 1]);
  const div1OverlayOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);
  const div2OverlayOpacity = useTransform(scrollYProgress, [0.05, 0.1], [1, 0]);
  const div3OverlayOpacity = useTransform(scrollYProgress, [0.1, 0.15], [1, 0]);

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
              <div
                className="flex flex-col items-center gap-4 min-w-[150px]"
                key={index}
              >
                <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden">
                  <motion.div
                    style={{
                      opacity:
                        index % 2 === 0
                          ? index === 0
                            ? div1OverlayOpacity
                            : div3OverlayOpacity
                          : 1,
                    }}
                  >
                    <Image
                      src={`/img/food/${item.image}`}
                      alt="food"
                      fill
                      className="rounded-lg object-cover"
                    />
                  </motion.div>
                  {index % 2 === 0 && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-lg z-10 flex items-center justify-end text-right text-brown-500 text-xl",
                        ebGaramond.className
                      )}
                      style={{
                        opacity: index === 0 ? div1Opacity : div3Opacity,
                      }}
                    >
                      <div className="flex flex-col gap-2">
                        <h1>{food[index * 2 + 1].title}</h1>
                        <p className="text-sm">
                          {food[index * 2 + 1].description}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
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
                <div
                  className="flex flex-col items-center gap-4 min-w-[150px]"
                  key={index}
                >
                  <div className="relative flex items-center justify-center aspect-square w-full overflow-hidden">
                    <motion.div
                      style={{
                        opacity: index % 2 === 1 ? div2OverlayOpacity : 1,
                      }}
                    >
                      <Image
                        src={`/img/food/${item.image}`}
                        alt="food"
                        fill
                        className="rounded-lg object-cover"
                      />
                    </motion.div>
                    {index % 2 === 1 && (
                      <motion.div
                        className={cn(
                          "absolute inset-0 rounded-lg z-10 flex items-center justify-start text-left text-brown-500 text-xl",
                          ebGaramond.className
                        )}
                        style={{
                          opacity: div2Opacity,
                        }}
                      >
                        <div className="flex flex-col gap-2">
                          <h1>{food[index * 2].title}</h1>
                          <p className="text-sm">
                            {food[index * 2].description}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )
            )}
        </div>
      </motion.div>
    </div>
  );
}
