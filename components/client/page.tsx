"use client";

import MotionDiv from "./motiondiv";
import { ArtistCard, TrackCard } from "./spotify/artist";
import Image from "next/image";
import { Artist, Track } from "@spotify/web-api-ts-sdk";
import { useEffect, useRef, useState } from "react";
import { getTopTracks } from "@/lib/spotify";
import { getTopArtists } from "@/lib/spotify";

const food = [
  "01_malai_kofta.JPG",
  "02_rasgulla.jpg",
  "03_salmon_tartare.jpg",
  "04_pasta.jpg",
  "05_tg.jpg",
  "06_rava_dosa.jpg",
];

export default function Page() {
  const [topTracks, setTopTracks] = useState<Track[]>([]);
  const [topArtists, setTopArtists] = useState<Artist[]>([]);

  useEffect(() => {
    getTopTracks().then(setTopTracks);
    getTopArtists().then(setTopArtists);
  }, []);

  const motionDivRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className="w-screen md:w-full h-screen md:h-full overflow-auto bg-gray-100"
      ref={motionDivRef}
    >
      <div className="w-full py-12 overflow-y-auto">
        <div className="flex items-center gap-4 px-8">
          <Image src="/me.png" alt="me" width={100} height={100} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">👋 I&apos;m Anirudh</h1>
          </div>
        </div>
        <div className="flex overflow-hidden w-full h-[160px]">
          {motionDivRef.current && (
            <MotionDiv containerRef={motionDivRef} scroll={[0, -1000]}>
              {topTracks.map((item: Track, index: number) => (
                <TrackCard track={item} key={index} />
              ))}
            </MotionDiv>
          )}
        </div>
        <div className="flex overflow-hidden w-full">
          {motionDivRef.current && (
            <MotionDiv containerRef={motionDivRef} scroll={[-160 * 2, 0]}>
              {topArtists.map((item: Artist, index: number) => (
                <ArtistCard artist={item} key={index} />
              ))}
            </MotionDiv>
          )}
        </div>
        <div className="p-4 flex items-center justify-center w-full">
          <div className="flex justify-center overflow-hidden w-full gap-4">
            <div className="flex flex-col gap-4">
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
            </div>
            <div className="flex flex-col gap-4 mt-6">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
