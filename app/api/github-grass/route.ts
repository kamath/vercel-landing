const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

const fetchContributions = async (
  username: string,
  nDays: number
): Promise<CalendarData> => {
  const query = `
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                color
                contributionCount
                date
                weekday
              }
            }
          }
        }
      }
    }
  `;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
    },
    body: JSON.stringify({ query, variables: { login: username } }),
  });
  if (!res.ok) throw new Error("Failed to fetch from GitHub");
  const data = await res.json();
  const calendar = data.data.user.contributionsCollection.contributionCalendar;

  // Flatten all days
  const allDays: ContributionDay[] = calendar.weeks.flatMap(
    (w: Week) => w.contributionDays
  );
  // Get last nDays
  const lastNDays = allDays.slice(-nDays);
  // Re-group into weeks (GitHub weeks are always 7 days)
  const weeks: Week[] = [];
  for (let i = 0; i < lastNDays.length; i += 7) {
    weeks.push({ contributionDays: lastNDays.slice(i, i + 7) });
  }
  const totalContributions = lastNDays.reduce(
    (sum, d) => sum + d.contributionCount,
    0
  );
  return { totalContributions, weeks };
};

// Simple in-memory cache
const cache: Record<string, { data: CalendarData; expires: number }> = {};
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  const days = searchParams.get("days");
  if (!user || typeof user !== "string") {
    return new Response(JSON.stringify({ error: "Missing user parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  let nDays = 180;
  if (typeof days === "string") {
    const parsed = parseInt(days, 10);
    if (!isNaN(parsed) && parsed > 0) {
      nDays = Math.min(parsed, 365); // cap at 365 days
    }
  }
  const cacheKey = `${user}:${nDays}`;
  const now = Date.now();
  if (cache[cacheKey] && cache[cacheKey].expires > now) {
    return new Response(JSON.stringify(cache[cacheKey].data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=21600, stale-while-revalidate",
      },
    });
  }
  try {
    const calendar = await fetchContributions(user, nDays);
    cache[cacheKey] = { data: calendar, expires: now + CACHE_TTL };
    return new Response(JSON.stringify(calendar), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=21600, stale-while-revalidate",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to fetch contributions" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
