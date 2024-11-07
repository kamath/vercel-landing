"use server";
import Iphone15Pro from "@/components/ui/iphone-15-pro";
import React from "react";
import Page from "@/components/client/page";

export default async function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="relative">
        <Iphone15Pro className="size-full md:block hidden">
          <Page />
        </Iphone15Pro>
        <div className="md:hidden block w-full h-full">
          <Page />
        </div>
      </div>
    </div>
  );
}
