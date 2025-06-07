import React, { useEffect, useRef, useState } from "react";

interface ContributionDay {
  color: string;
  contributionCount: number;
  date: string;
  weekday: number;
}
interface Week {
  contributionDays: ContributionDay[];
}
interface CalendarData {
  totalContributions: number;
  weeks: Week[];
}

export default function GithubGrass({ username }: { username: string }) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(12);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/github-grass?user=${username}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load grass");
        setLoading(false);
      });
  }, [username]);

  useEffect(() => {
    if (!data) return;
    function updateCellSize() {
      if (containerRef.current && data) {
        const containerWidth = containerRef.current.offsetWidth;
        const numWeeks = data.weeks.length;
        const gap = 2; // 0.5rem gap in px (tailwind 0.5 = 2px)
        const totalGap = (numWeeks - 1) * gap;
        const size = Math.floor((containerWidth - totalGap) / numWeeks);
        setCellSize(size > 0 ? size : 1);
      }
    }
    updateCellSize();
    window.addEventListener("resize", updateCellSize);
    return () => window.removeEventListener("resize", updateCellSize);
  }, [data]);

  if (loading)
    return <div className="text-gray-400">Loading GitHub grass...</div>;
  if (error || !data)
    return <div className="text-red-500">{error || "No data"}</div>;

  return (
    <div className="flex flex-col gap-0.5 w-full" ref={containerRef}>
      <div className="flex flex-row gap-0.5 w-full">
        {data.weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            {week.contributionDays.map((day, j) => (
              <div
                key={j}
                title={`${day.date}: ${day.contributionCount} contributions`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: `rgba(0, 155, 0, ${Math.min(
                    (day.contributionCount + 1) / 10,
                    1
                  )})`,
                }}
                className=""
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
