import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { Platform, StyleSheet, TextInput, TouchableOpacity, Text, View } from 'react-native';
import { Audio } from 'expo-av';
import { RecordingOptions, AndroidOutputFormat, AndroidAudioEncoder, IOSOutputFormat, IOSAudioQuality } from 'expo-av/build/Audio/Recording';

const LAMBDA_URL = 'REDACTED';

const isWeb = Platform.OS === 'web';

// "The raw sound data must be 44100Hz, 1 channel (Mono), signed 16 bit PCM little endian."
const SHAZAM_RECORDING_OPTIONS: RecordingOptions = {
  isMeteringEnabled: true,
  android: {
    extension: '.3gp',
    outputFormat: AndroidOutputFormat.THREE_GPP,
    audioEncoder: AndroidAudioEncoder.AMR_NB,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 44100 * 16 * 1,
  },
  ios: {
    extension: '.m4a',
    audioQuality: IOSAudioQuality.MIN,
    outputFormat: IOSOutputFormat.MPEG4AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 44100 * 16 * 1,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 44100 * 16 * 1,
  },
};

interface SongInfo {
  track: {
    title: string;
    subtitle: string;
  };
  matches: unknown[];
}

export default function EncryptionScreen() {
  const [text, setText] = useState('');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFindingSong, setIsFindingSong] = useState(false);
  const [cannotFindSong, setCannotFindSong] = useState(false);
  const [isSongTooLong, setIsSongTooLong] = useState(false);
  const [songInfo, setSongInfo] = useState<SongInfo | {}>({});

  async function startRecording() {
    setCannotFindSong(false);
    setIsSongTooLong(false);
    setSongInfo({});
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      console.log('Starting recording');
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(SHAZAM_RECORDING_OPTIONS);
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    if (!recording) return;
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync(
      {
        allowsRecordingIOS: false,
      }
    );
    const uri = recording.getURI()!;
    console.log('Recording stopped and stored at', uri);
    setRecording(null);
    await handleEncryption(uri);
  }

  async function getRecordingBase64(uri: string) {
    if (isWeb) {
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64String = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      return base64String;
    }

    const fileInfo = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileInfo;
  }

  async function handleEncryption(songUri: string) {
    setIsFindingSong(true);
    const songB64 = await getRecordingBase64(songUri);
    console.log('Song base64 length:', songB64.length);
    if (songB64.length >= 500 * 1000) {
      console.log('Song base64 is too large');
      setIsSongTooLong(true);
      return;
    }
    const songInfo = await getSongInfo(songB64);
    setIsFindingSong(false);
    if (Object.keys(songInfo).length === 0) {
      console.log('Failed to get song info');
      setCannotFindSong(true);
      return;
    }
    if (songInfo['matches'].length === 0) {
      console.log('No song found');
      setCannotFindSong(true);
      return;
    }
    setSongInfo(songInfo);
    const title = songInfo['track']['title'];
    const subtitle = songInfo['track']['subtitle'];
    console.log('Song found:', title);
    console.log('Subtitle:', subtitle);
  }

  async function getSongInfo(songB64: string) {
    console.log('Attempting to send song to lambda');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(LAMBDA_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ song: songB64 }),
      });
      clearTimeout(timeoutId);
      return await response.json();
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error('Request timed out');
        } else {
          console.error('Failed to send song to lambda', error);
        }
      } else {
        console.error('An unknown error occurred when sending the song to the lambda', error);
      }
      return {};
    }
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

      <TouchableOpacity style={styles.button} onPress={isRecording ? stopRecording : startRecording}>
        <Text style={styles.buttonText}>{isRecording ? 'Stop Recording' : 'Start Recording'}</Text>
      </TouchableOpacity>

      {isFindingSong && <Text style={styles.resultsText}>Finding song...</Text>}
      {isSongTooLong && <Text style={styles.resultsText}>Song is too long</Text>}
      {cannotFindSong && <Text style={styles.resultsText}>Failed to find song</Text>}
      {'track' in songInfo && (
        <View>
          <Text style={styles.resultsText}>Song found:</Text>
          <Text style={styles.resultsText}>{songInfo.track.title}</Text>
          <Text style={styles.resultsText}>{songInfo.track.subtitle}</Text>
        </View>
      )}
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
