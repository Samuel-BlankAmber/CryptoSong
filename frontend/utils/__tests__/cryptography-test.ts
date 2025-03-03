import { generateAesKeyFromString, aesGcmEncrypt, aesGcmDecrypt } from '../cryptography';

it('encrypts and decrypts text', async () => {
  const key = 'my_key';
  const aesKey = generateAesKeyFromString(key);
  const plaintext = 'hello';
  const encrypted = await aesGcmEncrypt(plaintext, aesKey);
  const decrypted = await aesGcmDecrypt(encrypted, aesKey);
  expect(decrypted).toBe(plaintext);
  console.log(aesKey);
  console.log(encrypted);
});
