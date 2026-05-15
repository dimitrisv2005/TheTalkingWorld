import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { saveObject } from '../services/database';

const FLASK_URL = "https://dimisv1-object-translation-api.hf.space/scan";

const flagMap: { [key: string]: string } = {
  English: '🇬🇧',
  German: '🇩🇪',
  French: '🇫🇷',
  Spanish: '🇪🇸',
};

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
        body: JSON.stringify({ image: base64Data, target_lang: targetLang }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ gr: data.objectGr, tr: data.objectTr });
        saveObject({ gr: data.objectGr, tr: data.objectTr, lang: targetLang as string });
        speakTranslation(data.objectTr);
      } else {
        Alert.alert("Σφάλμα", "Ο server δεν μπόρεσε να αναγνωρίσει το αντικείμενο.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Σφάλμα Δικτύου", "Σιγουρέψου ότι ο server τρέχει.");
    } finally {
      setLoading(false);
    }
  };

  const flag = flagMap[targetLang ?? ''] ?? '🌍';

  const langCodeMap: { [key: string]: string } = {
  English: 'en-US',
  German: 'de-DE',
  French: 'fr-FR',
  Spanish: 'es-ES',
};

const speakTranslation = (text: string) => {
  const langCode = langCodeMap[targetLang ?? ''] ?? 'en-US';
  Speech.speak(text, {
    language: langCode,
    pitch: 1.0,
    rate: 0.9,
  });
};

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>⬅️</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Σκάναρε αντικείμενο</Text>
        <View style={styles.langBadge}>
          <Text style={styles.langFlag}>{flag}</Text>
          <Text style={styles.langText}>{targetLang}</Text>
        </View>
      </View>

      {/* Camera Box */}
      <View style={styles.cameraBox}>
        {image
          ? <Image source={{ uri: image }} style={styles.preview} />
          : (
            <View style={styles.placeholderContent}>
              <Text style={styles.cameraIcon}>📷</Text>
              <Text style={styles.cameraPlaceholder}>Πάτησε το κουμπί για να τραβήξεις φωτογραφία</Text>
            </View>
          )
        }
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Αναγνώριση αντικειμένου...</Text>
          </View>
        )}
      </View>

      {result && (
        <View style={styles.resultContainer}>
          <View style={styles.resultRow}>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>🇬🇷 Ελληνικά</Text>
              <Text style={styles.resultWord}>{result.gr}</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultLabel}>{flag} {targetLang}</Text>
              <View style={styles.translationRow}>
                <Text style={styles.resultWordTr}>{result.tr}</Text>
                <TouchableOpacity style={styles.speakButton} onPress={() => speakTranslation(result.tr)}>
                  <Text style={styles.speakIcon}>🔊</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsText}>+10 πόντοι 🎉</Text>
          </View>
        </View>
    )}

      {/* Κουμπί */}
      <TouchableOpacity
        style={[styles.cameraButton, loading && styles.disabledButton]}
        onPress={takePhoto}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Επεξεργασία..." : "📷 Λήψη Φωτογραφίας"}
        </Text>
      </TouchableOpacity>

      {result && (
        <TouchableOpacity style={styles.scanAgainButton} onPress={() => { setImage(null); setResult(null); }}>
          <Text style={styles.scanAgainText}>🔄 Νέο Σκάναρισμα</Text>
        </TouchableOpacity>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D1D21', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 40, marginBottom: 20 },
  backButton: { backgroundColor: '#2e2e33', padding: 10, borderRadius: 10, marginRight: 10 },
  backText: { color: '#007AFF', fontSize: 18, fontWeight: 'bold' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', color: '#fff' },
  langBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2e2e33', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#3e3e44' },
  langFlag: { fontSize: 18, marginRight: 5 },
  langText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  cameraBox: { width: '100%', height: 260, backgroundColor: '#2e2e33', borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#3e3e44', marginBottom: 20 },
  placeholderContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { fontSize: 50, marginBottom: 10 },
  cameraPlaceholder: { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 30 },
  preview: { width: '100%', height: '100%' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#fff', marginTop: 10, fontSize: 14 },
  resultContainer: { backgroundColor: '#2e2e33', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#3e3e44' },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultItem: { flex: 1, alignItems: 'center' },
  resultLabel: { fontSize: 12, color: '#aaa', marginBottom: 6 },
  resultWord: { fontSize: 20, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  resultWordTr: { fontSize: 20, fontWeight: 'bold', color: '#7ab8ff', textAlign: 'center' },
  resultArrow: { fontSize: 20, color: '#aaa', marginHorizontal: 10 },
  pointsBadge: { marginTop: 12, backgroundColor: '#1a3a2a', borderRadius: 10, padding: 8, alignItems: 'center', borderWidth: 1, borderColor: '#28a745' },
  pointsText: { color: '#28a745', fontWeight: 'bold', fontSize: 14 },
  cameraButton: { backgroundColor: '#007AFF', padding: 16, borderRadius: 14, alignItems: 'center' },
  disabledButton: { backgroundColor: '#444' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  scanAgainButton: { marginTop: 12, backgroundColor: '#2e2e33', padding: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: '#3e3e44' },
  scanAgainText: { color: '#fff', fontSize: 15, fontWeight: '600' },translationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  speakButton: { backgroundColor: '#1a3a5c', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF' },
  speakIcon: { fontSize: 16 },
});