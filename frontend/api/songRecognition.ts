const LAMBDA_URL = process.env.EXPO_PUBLIC_LAMBDA_URL || '';

if (!LAMBDA_URL) {
  throw new Error('LAMBDA_URL not set');
}

export interface SongInfo {
  track: {
    title: string;
    subtitle: string;
  };
  matches: unknown[];
}

export async function getSongInfo(songB64: string): Promise<SongInfo | {}> {
  console.log('Attempting to send song to lambda');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(LAMBDA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song: songB64 }),
    });
    clearTimeout(timeoutId);
    return await response.json();
  } catch (error) {
    console.error('Failed to send song to lambda:', error);
    return {};
  }
}
