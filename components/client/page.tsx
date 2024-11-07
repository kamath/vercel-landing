"use client";

import MotionDiv from "./motiondiv";
import { ArtistCard, TrackCard } from "./spotify/artist";
import Image from "next/image";
import { Artist, Track } from "@spotify/web-api-ts-sdk";
import { useEffect, useRef, useState } from "react";
import { getTopTracks } from "@/lib/spotify";
import { getTopArtists } from "@/lib/spotify";
import { PinterestScroll } from "./pinterestScroll";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart } from "@fortawesome/free-solid-svg-icons";
import Music from "./spotify/music";

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
      className="w-screen md:w-full h-screen md:h-full overflow-y-auto bg-black"
      ref={motionDivRef}
    >
      <div className="w-full overflow-hidden">
        <div className="flex items-center gap-4 px-8 pt-12 pb-4 bg-black text-gray-100">
          <Image src="/me.png" alt="me" width={75} height={75} />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold">"LANDING PAGE"</h1>
            <h5 className="text-sm">c/o ANIRUDH KAMATH</h5>
          </div>
        </div>
        <div className="relative">
          <div className="flex overflow-hidden w-full h-[160px]">
            {motionDivRef.current && (
              <MotionDiv containerRef={motionDivRef} scroll={[0, -160 * 2]}>
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
          {topTracks.length > 0 && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="flex items-center justify-center gap-4">
                <div className="w-5 h-5">
                  <Music />
                </div>
                <div className="text-gray-100">
                  <h1 className="text-xl font-bold">{topTracks[0].name}</h1>
                  <h5 className="text-sm">{topTracks[0].artists[0].name}</h5>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 flex items-center justify-center w-full overflow-hidden bg-white">
          {motionDivRef.current && (
            <PinterestScroll food={food} containerRef={motionDivRef} />
          )}
        </div>
      </div>
    </div>
  );
}
