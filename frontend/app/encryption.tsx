import { useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import useAudioRecorder from '@/hooks/useAudioRecorder';
import { getSongInfoFromUri } from '@/utils/audioHandler';
import { encryptText } from '@/utils/cryptosystem';
import { SongInfo } from '@/api/songRecognition';

const isWeb = Platform.OS === 'web';

enum State {
  Idle,
  Recording,
  ErrorWhileRecording,
  FindingSong,
  SongTooLong,
  NoSongFound,
  ErrorWhileFindingSong,
  Encrypting,
  ErrorWhileEncrypting,
  SuccessfulEncryption,
}

export default function EncryptionScreen() {
  const [text, setText] = useState('');
  const { startRecording, stopRecording } = useAudioRecorder();
  const [songInfo, setSongInfo] = useState<SongInfo | {}>({});
  const [state, setState] = useState(State.Idle);

  async function handleStartRecording() {
    setState(State.Recording);
    setSongInfo({});
    await startRecording();
  }

  async function handleStopRecording() {
    let uri;
    try {
      uri = await stopRecording();
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState(State.ErrorWhileRecording);
      return;
    }

    let songInfo;
    try {
      setState(State.FindingSong);
      songInfo = await getSongInfoFromUri(uri, isWeb);
      setSongInfo(songInfo);
    } catch (error) {
      if (!(error instanceof Error)) {
        console.error('Unknown error while finding song:', error);
        setState(State.ErrorWhileFindingSong);
        return;
      }
      if (error.message === 'Song base64 is too large') {
        setState(State.SongTooLong);
      } else if (error.message === 'No song found') {
        setState(State.NoSongFound);
      } else if (error.message === 'Failed to get song info') {
        setState(State.ErrorWhileFindingSong);
      } else {
        console.error('Unknown error while finding song:', error);
        setState(State.ErrorWhileFindingSong);
      }
      return;
    }

    let ciphertext;
    try {
      setState(State.Encrypting)
      ciphertext = await encryptText(text, songInfo);
      setState(State.SuccessfulEncryption);
    } catch (error) {
      console.error('Failed to encrypt text:', error);
      setState(State.ErrorWhileEncrypting);
      return;
    }

    await Clipboard.setStringAsync(ciphertext);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎵 Encryption 🎵</Text>
      <TextInput
        style={styles.input}
        placeholder='Enter text to encrypt'
        placeholderTextColor={'#888'}
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity style={styles.button} onPress={state === State.Recording ? handleStopRecording : handleStartRecording}>
        <Text style={styles.buttonText}>{state === State.Recording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>

      {state === State.ErrorWhileRecording && <Text style={styles.resultsText}>Failed to record audio</Text>}
      {state === State.FindingSong && <Text style={styles.resultsText}>Finding song...</Text>}
      {state === State.SongTooLong && <Text style={styles.resultsText}>Song is too long</Text>}
      {state === State.NoSongFound && <Text style={styles.resultsText}>No song found</Text>}
      {state == State.ErrorWhileFindingSong && <Text style={styles.resultsText}>Failed to find song</Text>}
      {'track' in songInfo && (
        <View>
          <Text style={styles.resultsText}>Song found:</Text>
          <Text style={styles.resultsText}>{songInfo.track.title}</Text>
          <Text style={styles.resultsText}>{songInfo.track.subtitle}</Text>
        </View>
      )}

      {state === State.Encrypting && <Text style={styles.resultsText}>Encrypting...</Text>}
      {state === State.ErrorWhileEncrypting && <Text style={styles.resultsText}>Failed to encrypt text</Text>}
      {state === State.SuccessfulEncryption && <Text style={styles.resultsText}>Ciphertext copied to clipboard!</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderColor: '#666',
    borderWidth: 1,
    backgroundColor: '#222',
    color: 'white',
    paddingHorizontal: 15,
    width: '80%',
    borderRadius: 8,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsText: {
    color: '#888',
    fontSize: 16,
    marginTop: 10,
  },
});
