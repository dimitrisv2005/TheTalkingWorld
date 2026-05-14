import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { initDB } from '../../services/database';

const languages = [
  { id: 'English', flag: '🇬🇧', name: 'English' },
  { id: 'German',  flag: '🇩🇪', name: 'Deutsch' },
  { id: 'French',  flag: '🇫🇷', name: 'Français' },
  { id: 'Spanish', flag: '🇪🇸', name: 'Español' },
];

let hasLoadedOnce = false;

export default function HomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(!hasLoadedOnce);
  const { height } = useWindowDimensions();

  const logoSize = height < 700 ? 120 : 160;
  const cardSize = height < 700 ? 110 : 130;
  const flagSize = height < 700 ? 36 : 44;
  const cardMargin = height < 700 ? 6 : 10;

  useEffect(() => {
    initDB();

    // ← Φόρτωσε την τελευταία γλώσσα
    AsyncStorage.getItem('lastLanguage').then((lang) => {
      if (lang) setSelected(lang);
    });

    if (!hasLoadedOnce) {
      const timer = setTimeout(() => {
        hasLoadedOnce = true;
        setLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (!selected) return;
    // ← Αποθήκευσε την επιλεγμένη γλώσσα
    AsyncStorage.setItem('lastLanguage', selected);
    router.push({
      pathname: '/scan' as any,
      params: { targetLang: selected },
    });
  };

  if (loading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../../assets/images/ttwLogo-removebg-preview.png')}
          style={styles.splashLogo}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/ttwLogo-removebg-preview.png')}
          style={{ width: logoSize, height: logoSize, resizeMode: 'contain' }}
        />
        <Text style={styles.appSubtitle}>Μάθε λέξεις με την κάμερά σου</Text>
      </View>

      <Text style={styles.title}>Ποια γλώσσα θέλεις να μάθεις;</Text>

      <View style={styles.grid}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={[
              styles.flagCard,
              { width: cardSize, height: cardSize, margin: cardMargin },
              selected === lang.id && styles.selectedCard,
            ]}
            onPress={() => setSelected(lang.id)}
          >
            <Text style={{ fontSize: flagSize, marginBottom: 6 }}>{lang.flag}</Text>
            <Text style={styles.langName}>{lang.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !selected && styles.disabledButton]}
        onPress={handleNext}
        disabled={!selected}
      >
        <Text style={styles.nextButtonText}>Επόμενο →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: { flex: 1, backgroundColor: '#1D1D21', alignItems: 'center', justifyContent: 'center' },
  splashLogo: { width: 280, height: 280, resizeMode: 'contain' },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D1D21', paddingHorizontal: 20, paddingVertical: 10 },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  appSubtitle: { fontSize: 13, color: '#aaa', marginTop: 4 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 15, textAlign: 'center', color: '#ccc' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  flagCard: { backgroundColor: '#2e2e33', borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  selectedCard: { backgroundColor: '#1a3a5c', borderWidth: 2, borderColor: '#007AFF' },
  langName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  nextButton: { marginTop: 15, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 12, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#444' },
  nextButtonText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});