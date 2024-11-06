"use server";

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
