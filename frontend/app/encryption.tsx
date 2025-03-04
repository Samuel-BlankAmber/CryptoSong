import { useState } from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, Text, View, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import useAudioRecorder from '@/hooks/useAudioRecorder';
import { getSongInfoFromUri } from '@/utils/audioHandler';
import { encryptText } from '@/utils/cryptosystem';
import { SongInfo } from '@/api/songRecognition';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
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
      } else {
        setState(State.ErrorWhileFindingSong);
      }
      return;
    }

    let ciphertext;
    try {
      setState(State.Encrypting);
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
        placeholder="Enter text to encrypt"
        placeholderTextColor={'#AAA'}
        value={text}
        onChangeText={setText}
      />

      <TouchableOpacity
        style={[styles.button, state === State.Recording && styles.buttonRecording]}
        onPress={state === State.Recording ? handleStopRecording : handleStartRecording}
      >
        <Text style={styles.buttonText}>
          {state === State.Recording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>

      {state === State.FindingSong && <ActivityIndicator size="large" color="#1DB954" />}
      {state === State.Encrypting && <ActivityIndicator size="large" color="#1DB954" />}

      {state === State.ErrorWhileRecording && <Text style={styles.errorText}>Failed to record audio</Text>}
      {state === State.SongTooLong && <Text style={styles.errorText}>Song is too long</Text>}
      {state === State.NoSongFound && <Text style={styles.errorText}>No song found</Text>}
      {state === State.ErrorWhileFindingSong && <Text style={styles.errorText}>Failed to find song</Text>}
      {state === State.ErrorWhileEncrypting && <Text style={styles.errorText}>Failed to encrypt text</Text>}

      {'track' in songInfo && (
        <View style={styles.songInfoContainer}>
          <Text style={styles.resultsText}>Song found:</Text>
          <Text style={styles.songTitle}>{songInfo.track.title}</Text>
          <Text style={styles.songSubtitle}>{songInfo.track.subtitle}</Text>
        </View>
      )}

      {state === State.SuccessfulEncryption && <Text style={styles.successText}>Ciphertext copied to clipboard!</Text>}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
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
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderBottomWidth: 2,
    borderBottomColor: '#1DB954',
    backgroundColor: '#333',
    color: 'white',
    paddingHorizontal: 15,
    width: '80%',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#1DB954',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
    marginTop: 10,
    marginBottom: 10,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonRecording: {
    backgroundColor: '#D32F2F',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultsText: {
    color: '#FFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 16,
    marginTop: 10,
  },
  successText: {
    color: '#4CAF50',
    fontSize: 16,
    marginTop: 10,
  },
  songInfoContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 10,
    width: '80%',
  },
  songTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  songSubtitle: {
    color: '#AAA',
    fontSize: 16,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#1DB954',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
