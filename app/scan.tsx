import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveObject } from '../services/database';

const FLASK_URL = "http://192.168.1.140:5000/scan";

export default function ScanScreen() {
  const router = useRouter();
  const { targetLang } = useLocalSearchParams<{ targetLang: string }>();

  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ gr: string; tr: string } | null>(null);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Άδεια", "Χρειαζόμαστε πρόσβαση στην κάμερα!");
      return;
    }

    const res = await ImagePicker.launchCameraAsync({
      base64: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
    });

    if (!res.canceled) {
      setImage(res.assets[0].uri);
      sendToFlask(res.assets[0].base64 || "");
    }
  };

  const sendToFlask = async (base64Data: string) => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch(FLASK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: base64Data,
          target_lang: targetLang,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ gr: data.objectGr, tr: data.objectTr });
        saveObject({
          gr: data.objectGr,
          tr: data.objectTr,
          lang: targetLang as string,
        });
      } else {
        Alert.alert("Σφάλμα", "Ο server δεν μπόρεσε να αναγνωρίσει το αντικείμενο.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Σφάλμα Δικτύου", "Σιγουρέψου ότι ο Flask server τρέχει και η IP είναι σωστή.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Εκμάθηση: {targetLang}</Text>

      <View style={styles.cameraBox}>
        {image
          ? <Image source={{ uri: image }} style={styles.preview} />
          : <Text style={styles.cameraPlaceholder}>📷 Δεν έχει ληφθεί φωτογραφία</Text>
        }
      </View>

      <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? "Επεξεργασία..." : "📷 Λήψη Φωτογραφίας"}</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>🇬🇷 {result.gr}</Text>
          <Text style={styles.resultTextSub}>➡️ {result.tr}</Text>
        </View>
      )}

      <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
        <Text style={styles.backText}>← Πίσω</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', padding: 20, backgroundColor: '#1D1D21' },
  header: { fontSize: 20, fontWeight: 'bold', marginTop: 40, marginBottom: 20, color: '#fff' },
  cameraBox: { width: '100%', height: 300, backgroundColor: '#2e2e33', borderRadius: 15, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#3e3e44' },
  cameraPlaceholder: { color: '#888', fontSize: 16 },
  preview: { width: '100%', height: '100%' },
  cameraButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, marginTop: 20, width: '100%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  resultContainer: { marginTop: 30, padding: 20, backgroundColor: '#2e2e33', borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#3e3e44' },
  resultText: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  resultTextSub: { fontSize: 20, color: '#7ab8ff', marginTop: 5 },
  backLink: { marginTop: 30 },
  backText: { color: '#007AFF', fontSize: 16 },
});