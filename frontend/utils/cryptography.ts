import forge from 'node-forge';

export function generateAesKeyFromString(input: string): string {
  return forge.md.sha256.create().update(input).digest().getBytes();
}

export async function aesGcmEncrypt(plaintext: string, key: string): Promise<string> {
  if (key.length !== 32) {
    throw new Error('AES key must be 32 bytes long, did you forget to use generateAesKeyFromString?');
  }

  const iv = forge.random.getBytesSync(12);
  const cipher = forge.cipher.createCipher('AES-GCM', key);
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(plaintext));
  cipher.finish();
  const encrypted = cipher.output;
  const tag = cipher.mode.tag;
  const combined = forge.util.createBuffer();
  combined.putBytes(iv);
  combined.putBytes(tag.getBytes());
  combined.putBytes(encrypted.getBytes());
  return forge.util.encode64(combined.getBytes());
}

export async function aesGcmDecrypt(encryptedBase64: string, key: string): Promise<string> {
  if (key.length !== 32) {
    throw new Error('AES key must be 32 bytes long, did you forget to use generateAesKeyFromString?');
  }

  const encrypted = forge.util.decode64(encryptedBase64);
  const iv = forge.util.createBuffer(encrypted.slice(0, 12));
  const tag = forge.util.createBuffer(encrypted.slice(12, 28));
  const content = forge.util.createBuffer(encrypted.slice(28));
  const decipher = forge.cipher.createDecipher('AES-GCM', key);
  decipher.start({ iv, tag });
  decipher.update(content);
  decipher.finish();
  return decipher.output.toString();
}
