import { getSongInfo, SongInfo } from "@/api/songRecognition";
import { getRecordingBase64 } from "./fileHandling";

export async function getSongInfoFromUri(uri: string, isWeb: boolean): Promise<SongInfo> {
  const songB64 = await getRecordingBase64(uri, isWeb);

  console.log('Song base64 length:', songB64.length);
  if (songB64.length >= 500 * 1000) {
    throw new Error('Song base64 is too large');
  }

  const songInfo = await getSongInfo(songB64);
  if (!('matches' in songInfo)) {
    throw new Error('Failed to get song info');
  }

  if (songInfo.matches.length === 0) {
    throw new Error('No song found');
  }

  return songInfo;
}
