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
import { MotionValue, useScroll } from "framer-motion";
import AnimateHorizontalScroll from "./animateHorizontal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGithub,
  faInstagram,
  faLinkedin,
  faTwitter,
} from "@fortawesome/free-brands-svg-icons";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "../ui/scroll-area";
import { cn } from "@/lib/utils";

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
    company: "Browserbase",
    role: "Engineer #5",
    description: "AI Grant Batch 3",
    duration: "Duration 1",
    image: "/img/brands/browserbase.svg",
    link: "https://browserbase.com",
  },
  {
    company: "Miracle",
    role: "Founding Engineer",
    description: "YC W23",
    duration: "Duration 2",
    image: "/img/brands/miracle.jpg",
    link: "https://miracleml.com",
  },
  {
    company: "Whatnot",
    role: "Founding ML Scientist",
    description: "YC W20, a16z",
    duration: "Duration 3",
    image: "/img/brands/whatnot.jpg",
    link: "https://whatnot.com",
  },
  {
    company: "Crowdstrike",
    role: "SWE Intern",
    description: "R&D/Intelligence",
    duration: "Duration 4",
    image: "/img/brands/crowdstrike.jpg",
    link: "https://crowdstrike.com",
  },
  {
    company: "Neo4j",
    role: "SWE Intern",
    description: "",
    duration: "Duration 5",
    image: "/img/brands/neo4j.jpg",
    link: "https://neo4j.com",
  },
  {
    company: "Apple",
    role: "SWE Intern",
    description: "Apple Health",
    duration: "Duration 6",
    image: "/img/brands/apple.png",
    link: "https://apple.com",
  },
  {
    company: "BCG",
    role: "Marketing Intern",
    description: "NAMR Marketing",
    duration: "Duration 7",
    image: "/img/brands/bcg.jpg",
    link: "https://bcg.com",
  },
  {
    company: "StockX",
    role: "Data Science Intern",
    description: "",
    duration: "Duration 8",
    image: "/img/brands/stockx.jpg",
    link: "https://stockx.com",
  },
];

const images = [
  {
    name: "lego_sf",
    image: "lego_sf.jpg",
  },
  {
    name: "half_dome",
    image: "half_dome.jpg",
  },
  {
    name: "point_reyes",
    image: "point_reyes.jpg",
  },
  {
    name: "sf_dance",
    image: "sf_dance.jpg",
  },
  {
    name: "twin_peaks",
    image: "twin_peaks.jpg",
  },
];

const socials = [
  {
    icon: faInstagram,
    link: "https://www.instagram.com/currychefwiththepot/",
  },
  {
    icon: faGithub,
    link: "https://github.com/kamath",
  },
  {
    icon: faLinkedin,
    link: "https://www.linkedin.com/in/anirudhk/",
  },
  {
    icon: faTwitter,
    link: "https://x.com/kamathematic",
  },
];

interface ScrollContextType {
  scrollYProgress: MotionValue<number>;
}

export const ScrollContext = createContext<ScrollContextType>({
  scrollYProgress: new MotionValue(),
});

function Loading() {
  return (
    <div className="flex gap-2 items-center justify-center h-full text-white font-bold text-2xl uppercase">
      <div className="loader"></div>
      Loading
    </div>
  );
}

function SpotifyLoadingImage({
  includeGradient = false,
}: {
  includeGradient?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center h-[160px] w-[160px] overflow-hidden",
        includeGradient && "bg-gradient-to-b from-black via-black to-white"
      )}
    ></div>
  );
}

function ImageCard({
  item,
  index,
}: {
  item: { name: string; image: string };
  index: number;
}) {
  const imageComponent = (
    <div
      className="relative w-[200px] max-h-[300px] aspect-[2/3] rounded-lg overflow-hidden"
      style={{
        left:
          index === 0
            ? "0"
            : `calc((100% - 200px) * ${index / (images.length - 1)})`,
      }}
    >
      <div className="aspect-square rounded-lg overflow-hidden">
        <Image
          src={`/img/misc/${item.image}`}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>
    </div>
  );
  return (
    <motion.div
      className="flex items-center justify-between gap-4"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{
        amount: 0.8,
      }}
    >
      {imageComponent}
      {/* {textComponent} */}
    </motion.div>
  );
}

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

  if (
    topTracks.length === 0 ||
    topArtists.length === 0 ||
    recentlyPlayed.length === 0
  ) {
    return <Loading />;
  }

  return (
    <ScrollContext.Provider value={{ scrollYProgress }}>
      <div className="w-full overflow-hidden">
        <div className="flex items-center justify-end gap-4 px-8 pt-12 pb-4 bg-black text-gray-100">
          <div className="flex flex-col text-right mt-8">
            <h1 className="text-2xl font-bold">&quot;LANDING PAGE&quot;</h1>
            <h5 className="text-sm">c/o ANIRUDH KAMATH</h5>
          </div>
        </div>
        <div className="relative">
          <div className="flex overflow-hidden w-full h-[160px]">
            <AnimateHorizontalScroll scroll={[0, -160 * 2]}>
              {Array.from({ length: 10 }).map((_, index) => {
                if (index < topTracks.length) {
                  return <TrackCard track={topTracks[index]} key={index} />;
                }
                return (
                  <SpotifyLoadingImage key={index} includeGradient={false} />
                );
              })}
            </AnimateHorizontalScroll>
          </div>
          <div className="flex overflow-hidden w-full">
            <AnimateHorizontalScroll scroll={[-160 * 2, 0]}>
              {Array.from({ length: 10 }).map((_, index) => {
                if (index < topArtists.length) {
                  return <ArtistCard artist={topArtists[index]} key={index} />;
                }
                return (
                  <SpotifyLoadingImage key={index} includeGradient={true} />
                );
              })}
            </AnimateHorizontalScroll>
          </div>
          {recentlyPlayed.length > 0 && (
            <div className="absolute inset-0">
              <motion.div
                className="relative w-full h-full bg-gradient-to-b from-black to-transparent flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{
                  margin: "0px 0px -80% 0px",
                }}
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
                      <div className="w-[200px]">
                        <h1 className="text-xl font-bold truncate">
                          {recentlyPlayed[0].track.name.toUpperCase()}
                        </h1>
                        <h5 className="text-sm truncate">
                          {recentlyPlayed[0].track.artists[0].name}
                        </h5>
                      </div>
                      <h5 className="text-xs">
                        {recentlyPlayed[0].played_at.toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          }
                        )}
                      </h5>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
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

        <div className="bg-black">
          <div className="flex flex-col gap-4 rounded-xl overflow-hidden">
            <div className="flex w-full h-[150px] relative">
              <AnimateHorizontalScroll window={[0.1, 1]} scroll={[0, -100]}>
                <div className="relative w-[900px] max-h-[200px] aspect-video">
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
            <div className="text-white mb-8">
              <ScrollArea className="flex gap-4 overflow-x-auto pb-4 w-full pr-8">
                {workExperience.map((item, index) => (
                  <motion.div
                    className={cn("flex flex-col gap-2", index === 0 && "ml-8")}
                    key={index}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{
                      amount: 0.3,
                      margin: "0px 0px -20% 0px",
                    }}
                    transition={{
                      delay: index <= 2 ? 0.2 * index : 0,
                      duration: 1,
                    }}
                  >
                    <div className="relative w-[130px] shrink-0 aspect-square rounded-lg overflow-hidden">
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
                      <div className="flex gap-1">
                        <h5 className="text-xs">
                          {item.role}
                          <br />
                          {item.description}
                        </h5>
                      </div>
                    </div>
                  </motion.div>
                ))}
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {images.map((item, index) => (
            <ImageCard item={item} key={index} index={index} />
          ))}
        </div>

        <div className="flex flex-col gap-2 bg-black py-16">
          <div className="flex gap-2 items-end justify-center text-white text-xl uppercase">
            <p className="font-bold">anirudh</p>{" "}
            <p className="font-normal text-xs mb-[0.3rem]">@</p>{" "}
            <p className="font-bold">kamath</p>{" "}
            <p className="font-normal text-xs mb-[0.2rem]">.io</p>
          </div>
          <div className="flex gap-2 items-center justify-center text-white font-bold text-2xl uppercase">
            {socials.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, marginTop: 20 }}
                whileInView={{ opacity: 1, marginTop: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <a href={item.link} target="_blank">
                  <FontAwesomeIcon icon={item.icon} className="text-4xl" />
                </a>
              </motion.div>
            ))}
          </div>
          <div className="flex items-center text-center justify-center text-white text-sm px-8">
            <h1 className="text-white text-xs">
              Made with ❤️ in San Francisco
            </h1>
          </div>
        </div>
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
      {scrollContext ? (
        <ScrollableSection motionDivRef={motionDivRef} />
      ) : (
        <Loading />
      )}
    </div>
  );
}
