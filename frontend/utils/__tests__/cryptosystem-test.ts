import { encryptText, decryptText } from "../cryptosystem";

it('encrypts and decrypts text', async () => {
  const plaintext = 'hello';
  const songInfo = {
    track: {
      title: 'title',
      subtitle: 'subtitle',
    },
    matches: [],
  };
  const encrypted = await encryptText(plaintext, songInfo);
  const decrypted = await decryptText(encrypted, songInfo);
  expect(decrypted).toBe(plaintext);
});

it('encrypts and decrypts text with emojis', async () => {
  const plaintext = 'hello 😊😱🐶';
  const songInfo = {
    track: {
      title: 'title',
      subtitle: 'subtitle',
    },
    matches: [],
  };
  const encrypted = await encryptText(plaintext, songInfo);
  const decrypted = await decryptText(encrypted, songInfo);
  expect(decrypted).toBe(plaintext);
});
