"use server";
import type {
  Artist,
  Page,
  PlaybackState,
  Track,
} from "@spotify/web-api-ts-sdk";

export async function getAccessToken(
  code: string,
  state: string
): Promise<Record<string, unknown>> {
  if (!code || Array.isArray(code)) {
    throw new Error("Invalid code parameter");
  }
  if (state === null) {
    throw new Error("State mismatch");
  }

  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    form: {
      code: code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      grant_type: "authorization_code",
    },
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID! +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET!
        ).toString("base64"),
    },
    json: true,
  };

  const response = await fetch(authOptions.url, {
    method: "POST",
    headers: authOptions.headers,
    body: new URLSearchParams(authOptions.form).toString(),
  });

  const data = await response.json();
  return data;
}

export async function getTopArtists(
  initAccessToken?: string
): Promise<Artist[]> {
  const accessToken = initAccessToken || (await getRefreshToken()).access_token;

  const response = await fetch(
    "https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=5",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const page: Page<Artist> = await response.json();
  const topArtists: Artist[] = page.items;
  console.log(
    "ARTISTS",
    JSON.stringify(
      topArtists
        .sort((a, b) => a.popularity - b.popularity)
        .map((t) => {
          return {
            name: t.name,
            popularity: t.popularity,
          };
        })
        .reverse(),
      null,
      2
    )
  );
  return topArtists;
}

export async function getTopTracks(initAccessToken?: string): Promise<Track[]> {
  const accessToken = initAccessToken || (await getRefreshToken()).access_token;

  const response = await fetch(
    "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const page: Page<Track> = await response.json();
  const topTracks: Track[] = page.items;
  const suggestion = topTracks
    .sort((a, b) => a.popularity - b.popularity)
    .reverse();
  console.log(
    "SUGGESTIONS",
    JSON.stringify(
      suggestion.map((t) => {
        return {
          name: t.name,
          popularity: t.popularity,
          artists: t.artists.map((a) => a.name),
        };
      }),
      null,
      2
    )
  );
  return topTracks;
}

export async function getRecentlyPlayed(
  initAccessToken?: string
): Promise<{ track: Track; played_at: Date }[]> {
  const accessToken = initAccessToken || (await getRefreshToken()).access_token;

  const response = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const page: Page<{
    track: Track;
    played_at: string;
    context: Record<string, unknown>;
  }> = await response.json();
  console.log("RECENTLY PLAYED", JSON.stringify(page, null, 2));
  const recentlyPlayed: { track: Track; played_at: Date }[] = page.items.map(
    (t) => ({ track: t.track, played_at: new Date(t.played_at) })
  );
  return recentlyPlayed;
}

export async function getRefreshToken(): Promise<{
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  scope: string;
}> {
  const refresh_token = process.env.SPOTIFY_REFRESH_TOKEN!;
  const authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID! +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET!
        ).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  const response = await fetch(authOptions.url, {
    method: "POST",
    headers: authOptions.headers,
    body: new URLSearchParams(authOptions.form).toString(),
  });

  const data = await response.json();
  return data;
}
