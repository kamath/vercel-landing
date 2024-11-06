"use client";

import { getAccessToken } from "@/app/api/spotify/route";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Callback() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    getAccessToken(searchParams.get("code")!, searchParams.get("state")!).then(
      setData
    );
  }, [searchParams]);

  return <div>{JSON.stringify(data)}</div>;
}
