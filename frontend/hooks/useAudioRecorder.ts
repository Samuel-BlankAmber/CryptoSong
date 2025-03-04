import { useState } from "react";
import { Audio } from "expo-av";
import { RecordingOptions, AndroidOutputFormat, AndroidAudioEncoder, IOSOutputFormat, IOSAudioQuality } from 'expo-av/build/Audio/Recording';

// To use the API:
// "The raw sound data must be 44100Hz, 1 channel (Mono), signed 16 bit PCM little endian."
// The backend handles the conversion to PCM.
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

export default function useAudioRecorder() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  async function startRecording() {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      console.log('Starting recording');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(SHAZAM_RECORDING_OPTIONS);
      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  async function stopRecording(): Promise<string> {
    if (!recording) {
      throw new Error('No recording to stop');
    }

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI()!;
    console.log('Recording stopped and stored at:', uri);
    setRecording(null);
    return uri;
  }

  return { recording, startRecording, stopRecording };
}
