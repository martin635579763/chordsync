'use server';

import SpotifyWebApi from 'spotify-web-api-node';

let spotifyApi: SpotifyWebApi | null = null;

async function getSpotifyApi() {
  if (spotifyApi && spotifyApi.getAccessToken()) {
    return spotifyApi;
  }

  const credentials = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  };

  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error('Spotify API credentials are not set in environment variables.');
  }

  const newSpotifyApi = new SpotifyWebApi(credentials);

  try {
    const data = await newSpotifyApi.clientCredentialsGrant();
    newSpotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi = newSpotifyApi;
    return spotifyApi;
  } catch (err) {
    console.error('Something went wrong when retrieving an access token', err);
    throw new Error('Failed to authenticate with Spotify API.');
  }
}

export async function getTrackDetails(trackUri: string) {
  try {
    const api = await getSpotifyApi();
    const trackId = trackUri.split(':').pop();
    if (!trackId) {
        return null;
    }
    const { body: track } = await api.getTrack(trackId);
    return {
      name: track.name,
      artists: track.artists.map((artist) => artist.name),
      album: track.album.name,
      albumArt: track.album.images?.[0]?.url,
    };
  } catch (error) {
    console.error('Error fetching track details from Spotify:', error);
    // Invalidate the client if there's an auth error
    if ((error as any).statusCode === 401) {
        spotifyApi = null;
    }
    return null;
  }
}
