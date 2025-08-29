
'use server';

import SpotifyWebApi from 'spotify-web-api-node';

let spotifyApi: SpotifyWebApi | null = null;

async function getSpotifyApi() {
  if (spotifyApi && spotifyApi.getAccessToken()) {
    try {
      // Ping the API to see if the token is still valid
      await spotifyApi.getMe();
      return spotifyApi;
    } catch (error) {
       // Invalidate client if token is expired
      spotifyApi = null;
    }
  }

  const credentials = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  };

  if (!credentials.clientId || !credentials.clientSecret) {
    console.error('Spotify API credentials are not set in environment variables.');
    // No point in continuing if creds aren't set.
    return null;
  }

  const newSpotifyApi = new SpotifyWebApi(credentials);

  try {
    const data = await newSpotifyApi.clientCredentialsGrant();
    newSpotifyApi.setAccessToken(data.body['access_token']);
    spotifyApi = newSpotifyApi;
    return spotifyApi;
  } catch (err) {
    console.error('Something went wrong when retrieving an access token', err);
    spotifyApi = null;
    return null;
  }
}

export async function getTrackDetails(trackUri: string) {
  try {
    const api = await getSpotifyApi();
    if (!api) {
        throw new Error("Spotify client not available.");
    }
    const trackId = trackUri.split(':').pop();
    if (!trackId) {
        return null;
    }
    const { body: track } = await api.getTrack(trackId);
    
    const trackDetails = {
      uri: track.uri,
      name: track.name,
      artists: track.artists.map((artist) => artist.name),
      album: track.album.name,
      art: track.album.images?.[0]?.url || 'https://picsum.photos/100',
      previewUrl: track.preview_url,
    };

    console.log('Successfully fetched track details from Spotify for URI:', trackUri);
    
    return trackDetails;
  } catch (error) {
    console.error('Error fetching track details from Spotify for trackUri', trackUri, ':', error);
    // Invalidate the client if there's an auth error
    if ((error as any).statusCode === 401) {
        spotifyApi = null;
    }
    return null;
  }
}

export async function searchTracks(query: string) {
  try {
    const api = await getSpotifyApi();
    if (!api) {
      throw new Error("Spotify client not available.");
    }

    const { body } = await api.searchTracks(query, { limit: 10 });
    
    if (!body.tracks) {
      return [];
    }
    
    const searchResults = body.tracks.items.map((track) => ({
      uri: track.uri,
      name: track.name,
      artist: track.artists.map((artist) => artist.name).join(', '),
      art: track.album.images?.[0]?.url || 'https://picsum.photos/100',
      previewUrl: track.preview_url,
    }));
    
    console.log(`Found ${searchResults.length} tracks for query "${query}"`);

    return searchResults;

  } catch (error) {
    console.error(`Error searching tracks for query "${query}":`, error);
    if ((error as any).statusCode === 401) {
        spotifyApi = null;
    }
    return [];
  }
}
