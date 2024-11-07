"use server";
import Iphone15Pro from "@/components/ui/iphone-15-pro";
import React from "react";
import Page from "@/components/client/page";

export default async function Home() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div className="relative overflow-hidden">
        <Iphone15Pro className="size-full md:block hidden overflow-hidden">
          <Page />
        </Iphone15Pro>
        <div className="md:hidden block w-screen h-screen overflow-hidden">
          <Page />
        </div>
      </div>
    </div>
  );
}
