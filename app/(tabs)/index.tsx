import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { initDB } from '../../services/database';

const languages = [
  { id: 'English', flag: '🇬🇧', name: 'English' },
  { id: 'German',  flag: '🇩🇪', name: 'Deutsch' },
  { id: 'French',  flag: '🇫🇷', name: 'Français' },
  { id: 'Spanish', flag: '🇪🇸', name: 'Español' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    initDB();
  }, []);

  const handleNext = () => {
    if (!selected) return;
    router.push({
      pathname: '/scan' as any,
      params: { targetLang: selected },
    });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image 
          source={require('../../assets/images/ttwLogo-removebg-preview.png')} 
          style={styles.logo} 
        />
        {/* Αντικατέστησε με: <Image source={require('../../assets/images/logo.png')} style={styles.logo} /> */}
        {/*<Text style={styles.logoPlaceholder}>🔍</Text>
        {<Text style={styles.appName}>AI Scanner</Text>*/}
        <Text style={styles.appSubtitle}>Μάθε λέξεις με την κάμερά σου</Text>
      </View>

      <Text style={styles.title}>Ποια γλώσσα θέλεις να μάθεις;</Text>

      <View style={styles.grid}>
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.id}
            style={[styles.flagCard, selected === lang.id && styles.selectedCard]}
            onPress={() => setSelected(lang.id)}
          >
            <Text style={styles.flagEmoji}>{lang.flag}</Text>
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

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#1D1D21' },
  container: { flexGrow: 1, alignItems: 'center', paddingTop: 60, paddingBottom: 40, backgroundColor: '#1D1D21', padding: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoPlaceholder: { fontSize: 100 },
  logo: { width: 200, height: 200, resizeMode: 'contain' },
  appName: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 10 },
  appSubtitle: { fontSize: 14, color: '#aaa', marginTop: 5 },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 20, textAlign: 'center', color: '#ccc' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  flagCard: { width: 140, height: 140, backgroundColor: '#2e2e33', margin: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  selectedCard: { backgroundColor: '#1a3a5c', borderWidth: 2, borderColor: '#007AFF' },
  flagEmoji: { fontSize: 50, marginBottom: 10 },
  langName: { fontSize: 16, fontWeight: '600', color: '#fff' },
  nextButton: { marginTop: 30, backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#444' },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});