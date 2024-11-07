"use server";
import Iphone15Pro from "@/components/ui/iphone-15-pro";
import React from "react";
import Image from "next/image";
import { getTopArtists, getTopTracks } from "./api/spotify/route";
import { ArtistCard, TrackCard } from "@/components/client/spotify/artist";
import { Artist, Track } from "@spotify/web-api-ts-sdk";

export default async function Home() {
  const topArtists = await getTopArtists();
  const topTracks = await getTopTracks();
  console.log("topArtists", JSON.stringify(topArtists, null, 2));
  console.log("topTracks", JSON.stringify(topTracks, null, 2));

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="relative">
        <Iphone15Pro className="size-full">
          <div className="w-full h-full flex overflow-auto bg-gray-100">
            <div className="w-full py-12 flex flex-col gap-4">
              <div className="flex items-center gap-4 px-8">
                <Image src="/me.png" alt="me" width={100} height={100} />
                <div className="flex flex-col">
                  <h1 className="text-2xl font-bold">👋 I&apos;m Anirudh</h1>
                </div>
              </div>
              <div className="flex overflow-x-auto w-full">
                {topTracks.map((item: Track, index: number) => (
                  <TrackCard track={item} index={index} key={index} />
                ))}
              </div>
              <div className="flex overflow-x-auto w-full">
                {topArtists.map((item: Artist, index: number) => (
                  <ArtistCard artist={item} index={index} key={index} />
                ))}
              </div>
            </div>
          </div>
        </Iphone15Pro>
      </div>
    </div>
  );
}
