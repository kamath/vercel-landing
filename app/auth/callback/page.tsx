"use client";

import { getAccessToken } from "@/lib/spotify";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function CallbackWithSearchParams() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getAccessToken(searchParams.get("code")!, searchParams.get("state")!).then(
      setData
    );
  }, [searchParams]);

  return <div>{JSON.stringify(data)}</div>;
}

export default function Callback() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackWithSearchParams />
    </Suspense>
  );
}
