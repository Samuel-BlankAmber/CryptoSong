import * as FileSystem from 'expo-file-system';

export async function getRecordingBase64(uri: string, isWeb: boolean): Promise<string> {
  if (isWeb) {
    return await getWebBase64(uri);
  }
  return await getNativeBase64(uri);
}

async function getWebBase64(uri: string): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  return base64String;
}

async function getNativeBase64(uri: string): Promise<string> {
  const fileInfo = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileInfo;
}
