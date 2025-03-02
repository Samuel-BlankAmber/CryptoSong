import { TouchableOpacity, Image, StyleSheet, Text } from 'react-native';
import { useRouter } from "expo-router";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

      <ThemedText type="title" style={styles.title}>🎵 CryptoSong 🎵</ThemedText>
      <ThemedText type="defaultSemiBold" style={styles.subtitle}>
        Secure your messages through music
      </ThemedText>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/encryption")}>
        <Text style={styles.buttonText}>Encrypt</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push("/decryption")}>
        <Text style={styles.buttonText}>Decrypt</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBBBBB',
    marginBottom: 20,
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
});
