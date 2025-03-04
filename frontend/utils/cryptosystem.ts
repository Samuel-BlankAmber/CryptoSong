import { SongInfo } from '@/api/songRecognition';
import { generateAesKeyFromString, aesGcmEncrypt, aesGcmDecrypt } from './cryptography';

async function getAesKey(songInfo: SongInfo): Promise<string> {
  if (!('track' in songInfo)) {
    throw new Error('No song found');
  }

  const title = songInfo.track.title;
  const subtitle = songInfo.track.subtitle;
  const key = title + subtitle;
  const aesKey = generateAesKeyFromString(key);
  return aesKey;
}

/**
 * Encrypts the given text using AES-GCM encryption with the song title and subtitle as the key.
 * It goes without saying, but this is highly insecure.
 * Please do not use this to encrypt anything important,
 * or risk having your data stolen.
 * 
 * @param {string} text - The text to be encrypted.
 * @param {SongInfo} songInfo - Information about the song.
 * @returns {Promise<string>} - A promise that resolves to the encrypted text.
 * @throws {Error} - Throws an error if no song is found in the songInfo.
 */
export async function encryptText(text: string, songInfo: SongInfo): Promise<string> {
  const aesKey = await getAesKey(songInfo);
  const ciphertext = await aesGcmEncrypt(text, aesKey);
  return ciphertext;
}

export async function decryptText(ciphertext: string, songInfo: SongInfo): Promise<string> {
  const aesKey = await getAesKey(songInfo);
  const text = await aesGcmDecrypt(ciphertext, aesKey);
  return text;
}
