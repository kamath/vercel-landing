"use client";

import { Artist, Track } from "@spotify/web-api-ts-sdk";
import Image from "next/image";
import { motion } from "framer-motion";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 min-w-[160px] min-h-[160px] aspect-square"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
    >
      <div className="relative flex items-center justify-center h-[160px] w-[160px] bg-gray-200  overflow-hidden">
        <Image
          src={artist.images.filter((a) => a.width === 640)[0]?.url}
          alt={artist.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent flex items-center justify-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-white flex items-center justify-center"></div>
      </div>
    </motion.div>
  );
}

export function TrackCard({ track }: { track: Track }) {
  return (
    <motion.div
      className="flex flex-col items-center gap-4 min-w-[160px] aspect-square"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
    >
      <div className="relative flex items-center justify-center h-[160px] w-[160px] bg-gray-200 overflow-hidden">
        <Image
          src={track.album.images.filter((a) => a.width === 640)[0]?.url}
          alt={track.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center justify-center"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent flex items-center justify-center"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent flex items-center justify-center"></div>
      </div>
    </motion.div>
  );
}
