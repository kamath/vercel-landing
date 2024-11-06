"use server";
import Iphone15Pro from "@/components/ui/iphone-15-pro";
import React from "react";
import MotionDiv from "@/components/client/motiondiv";
import Image from "next/image";

export default async function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="relative">
        <Iphone15Pro className="size-full">
          <div className="w-full h-full flex items-center justify-center overflow-auto">
            <div className="w-full h-[100px] bg-red-500">
              <Image src="/me.png" alt="me" width={100} height={100} />
              <MotionDiv />
            </div>
          </div>
        </Iphone15Pro>
      </div>
    </div>
  );
}
