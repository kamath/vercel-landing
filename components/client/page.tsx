"use client";

import { ArtistCard, TrackCard } from "./spotify/artist";
import Image from "next/image";
import { Artist, Track } from "@spotify/web-api-ts-sdk";
import { createContext, useEffect, useRef, useState } from "react";
import { getRecentlyPlayed, getTopTracks } from "@/lib/spotify";
import { getTopArtists } from "@/lib/spotify";
import { PinterestScroll } from "./pinterestScroll";
import { motion } from "framer-motion";
import Music from "./spotify/music";
import { MotionValue, useScroll, useTransform } from "framer-motion";
import AnimateHorizontalScroll from "./animateHorizontal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import { faHeart } from "@fortawesome/free-solid-svg-icons";

const food = [
  {
    title: "Pasta Pomodoro",
    description: "Fresh pasta with tomato sauce, basil and parmesan",
    image: "pasta.jpg",
  },
  {
    title: "Malai Kofta",
    description:
      "Velvety potato-paneer dumplings, simmered in a rich, spiced cream gravy.",
    image: "malai_kofta.JPG",
  },
  {
    title: "Rasgulla",
    description:
      "Handmade spongy paneer, infused with a cardamom rose syrup and topped with saffron.",
    image: "rasgulla.jpg",
  },
  {
    title: "Salmon Tartare",
    description: "Raw salmon with avocado, capers and citrus",
    image: "salmon_tartare.jpg",
  },
  {
    title: "Tandoori Grilled",
    description: "Spiced and grilled meat from the tandoor",
    image: "tg.jpg",
  },
  {
    title: "Rava Dosa",
    description: "Crispy traditional South Indian semolina crepe",
    image: "rava_dosa.jpg",
  },
];

const workExperience = [
  {
    company: "Company 1",
    role: "Role 1",
    duration: "Duration 1",
    image: "/img/brands/browserbase.svg",
  },
  {
    company: "Company 2",
    role: "Role 2",
    duration: "Duration 2",
    image: "/img/brands/browserbase.svg",
  },
  {
    company: "Company 3",
    role: "Role 3",
    duration: "Duration 3",
    image: "/img/brands/browserbase.svg",
  },
  {
    company: "Company 4",
    role: "Role 4",
    duration: "Duration 4",
    image: "/img/brands/browserbase.svg",
  },
  {
    company: "Company 5",
    role: "Role 5",
    duration: "Duration 5",
    image: "/img/brands/browserbase.svg",
  },
];

interface ScrollContextType {
  scrollYProgress: MotionValue<number>;
}

export const ScrollContext = createContext<ScrollContextType>({
  scrollYProgress: new MotionValue(),
});

function ScrollableSection({
  motionDivRef,
}: {
  motionDivRef: React.RefObject<HTMLDivElement>;
}) {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<
    { track: Track; played_at: Date }[]
  >([]);

  const { scrollYProgress } = useScroll({
    container: motionDivRef,
    offset: ["start start", "end start"],
  });

  useEffect(() => {
    getTopTracks().then(setTopTracks);
    getTopArtists().then(setTopArtists);
    getRecentlyPlayed().then(setRecentlyPlayed);
  }, []);

  const showBanner = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <ScrollContext.Provider value={{ scrollYProgress }}>
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-4 px-8 pt-12 pb-4 bg-black text-gray-100">
          <Image src="/me.png" alt="me" width={75} height={75} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">&quot;LANDING PAGE&quot;</h1>
            <h5 className="text-sm">c/o ANIRUDH KAMATH</h5>
          </div>
        </div>
        <div className="relative">
          <div className="flex overflow-hidden w-full h-[160px]">
            <AnimateHorizontalScroll scroll={[0, -160 * 2]}>
              {topTracks.map((item: Track, index: number) => (
                <TrackCard track={item} key={index} />
              ))}
            </AnimateHorizontalScroll>
          </div>
          <div className="flex overflow-hidden w-full">
            <AnimateHorizontalScroll scroll={[-160 * 2, 0]}>
              {topArtists.map((item: Artist, index: number) => (
                <ArtistCard artist={item} key={index} />
              ))}
            </AnimateHorizontalScroll>
          </div>
          {recentlyPlayed.length > 0 && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black to-transparent flex items-center justify-center"
              style={{ opacity: showBanner }}
            >
              <div className="flex flex-col gap-4 text-gray-100">
                <div className="flex items-center justify-center gap-4">
                  <div className="w-20 h-20 relative">
                    <div className="absolute inset-0">
                      <Image
                        src={recentlyPlayed[0].track.album.images[0].url}
                        alt={recentlyPlayed[0].track.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative bg-black/50 z-10 w-full h-full flex items-center justify-center">
                      <div className="w-5 h-5">
                        <Music />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm">Last Played:</h3>
                    <div>
                      <h1 className="text-xl font-bold">
                        {recentlyPlayed[0].track.name.toUpperCase()}
                      </h1>
                      <h5 className="text-sm">
                        {recentlyPlayed[0].track.artists[0].name}
                      </h5>
                    </div>
                    <h5 className="text-xs">
                      {recentlyPlayed[0].played_at.toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </h5>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-4 flex items-center justify-center w-full overflow-hidden bg-white">
          <div className="flex flex-col gap-4">
            <PinterestScroll food={food} />
            <div className="flex justify-center">
              <a
                href="https://www.instagram.com/currychefwiththepot/"
                target="_blank"
              >
                <button className="bg-black text-white px-6 py-3 rounded-full flex justify-center items-center gap-2 w-fit">
                  <FontAwesomeIcon icon={faInstagram} />
                  <h5 className="text-sm">currychefwiththepot</h5>
                </button>
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex w-full h-[160px]">
            <AnimateHorizontalScroll window={[0.1, 1]} scroll={[0, -300]}>
              <div className="relative w-[200vw] md:w-[700px] aspect-video">
                <Image
                  src="/img/sf.jpg"
                  alt="map"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
              </div>
            </AnimateHorizontalScroll>
          </div>
          <div className="text-white px-8">
            <h1 className="text-2xl w-full">
              <div className="flex items-center flex-wrap gap-2">
                <span className="whitespace-nowrap">With</span>
                <FontAwesomeIcon icon={faHeart} />
                <span className="whitespace-nowrap">from San Francisco</span>
              </div>
            </h1>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {workExperience.map((item, index) => (
                <div className="flex flex-col gap-2" key={index}>
                  <div className="relative w-[130px] shrink-0 aspect-square">
                    <Image
                      src={item.image}
                      alt={item.company}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-sm font-bold">
                      {item.company.toUpperCase()}
                    </h3>
                    <h5 className="text-xs">{item.role}</h5>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="h-[1000px] bg-black"></div>
      </div>
    </ScrollContext.Provider>
  );
}

export default function Page() {
  const motionDivRef = useRef<HTMLDivElement>(null);
  const [scrollContext, setScrollContext] = useState<boolean>(false);

  useEffect(() => {
    if (motionDivRef.current) {
      setScrollContext(true);
    }
  }, [motionDivRef]);

  return (
    <div
      className="w-screen md:w-full h-screen md:h-full overflow-y-auto bg-black"
      ref={motionDivRef}
    >
      {scrollContext && <ScrollableSection motionDivRef={motionDivRef} />}
    </div>
  );
}
