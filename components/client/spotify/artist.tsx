"use client";

import { Artist, Track } from "@spotify/web-api-ts-sdk";
import Image from "next/image";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <div className="flex flex-col items-center gap-4 min-w-[160px] min-h-[160px] aspect-square">
      <div className="relative flex items-center justify-center h-[160px] w-[160px] bg-gray-200  overflow-hidden">
        <Image
          src={artist.images.filter((a) => a.width === 640)[0]?.url}
          alt={artist.name}
          fill
          className=" object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          {/* <h1 className="text-sm font-bold text-white">{artist.name}</h1> */}
        </div>
      </div>
    </div>
  );
}

export function TrackCard({ track }: { track: Track }) {
  return (
    <div className="flex flex-col items-center gap-4 min-w-[160px] aspect-square">
      <div className="relative flex items-center justify-center h-[160px] w-[160px] bg-gray-200 overflow-hidden">
        <Image
          src={track.album.images.filter((a) => a.width === 640)[0]?.url}
          alt={track.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-sm text-center font-bold text-white">
            {/* {track.name} */}
          </h1>
        </div>
      </div>
    </div>
  );
}
