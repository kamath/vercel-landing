"use server";

import { redirect } from "next/navigation";

const client_id = process.env.SPOTIFY_CLIENT_ID!;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI!;

export default async function Login() {
  const scope =
    "user-top-read user-read-recently-played playlist-modify-public user-read-recently-played";
  const state = Math.random().toString(36).substring(2, 15);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: client_id!,
    scope: scope,
    redirect_uri: redirect_uri!,
    state: state,
  });

  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;

  // Redirect the user to Spotify auth
  redirect(spotifyAuthUrl);
  return <div>Login</div>;
}
