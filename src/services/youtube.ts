
'use server';

import { google } from 'googleapis';

let youtube: any;

async function getYouTubeClient() {
  if (youtube) {
    return youtube;
  }
  
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    console.error('YouTube API key is not set in environment variables.');
    throw new Error('YouTube API key is not configured.');
  }

  youtube = google.youtube({
    version: 'v3',
    auth: apiKey,
  });
  
  return youtube;
}

export async function searchYouTubeVideo(query: string): Promise<string | null> {
  try {
    const client = await getYouTubeClient();
    const response = await client.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults: 1,
    });

    if (response.data.items && response.data.items.length > 0) {
      const videoId = response.data.items[0].id?.videoId;
      console.log(`[YouTube] Found videoId: ${videoId} for query: "${query}"`);
      return videoId || null;
    } else {
      console.log(`[YouTube] No video found for query: "${query}"`);
      return null;
    }
  } catch (error) {
    console.error(`[YouTube] Error searching video for query "${query}":`, error);
    return null;
  }
}
