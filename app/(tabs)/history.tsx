import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import * as Speech from 'expo-speech'; // <-- ΠΡΟΣΘΗΚΗ ΤΟΥ IMPORT
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getAllObjects } from '../../services/database';

type ObjectRow = {
  id: number;
  objectNameGr: string;
  objectNameEnglish: string | null;
  objectNameGerman: string | null;
  objectNameFrench: string | null;
  objectNameSpanish: string | null;
};

const languages = [
  { id: 'objectNameEnglish', flag: '🇬🇧', name: 'English' },
  { id: 'objectNameGerman',  flag: '🇩🇪', name: 'Deutsch' },
  { id: 'objectNameFrench',  flag: '🇫🇷', name: 'Français' },
  { id: 'objectNameSpanish', flag: '🇪🇸', name: 'Español' },
];

// <-- ΠΡΟΣΘΗΚΗ ΤΟΥ MAP ΓΙΑ ΤΟΥΣ ΚΩΔΙΚΟΥΣ ΓΛΩΣΣΑΣ
const langCodeMap: { [key: string]: string } = {
  objectNameEnglish: 'en-US',
  objectNameGerman: 'de-DE',
  objectNameFrench: 'fr-FR',
  objectNameSpanish: 'es-ES',
};



export default function HistoryScreen() {
  const [objects, setObjects] = useState<ObjectRow[]>([]);
  const [activeLang, setActiveLang] = useState('objectNameEnglish');

  useFocusEffect(
    useCallback(() => {
      const data = getAllObjects();
      setObjects(data);

      // ← Φόρτωσε την τελευταία γλώσσα
      AsyncStorage.getItem('lastLanguage').then((lang) => {
        if (lang) {
          // Μετατροπή από 'English' σε 'objectNameEnglish'
          const langMap: { [key: string]: string } = {
            English: 'objectNameEnglish',
            German: 'objectNameGerman',
            French: 'objectNameFrench',
            Spanish: 'objectNameSpanish',
          };
          if (langMap[lang]) setActiveLang(langMap[lang]);
        }
      });
    }, [])
  );

  // <-- ΠΡΟΣΘΗΚΗ ΤΗΣ ΣΥΝΑΡΤΗΣΗΣ ΟΜΙΛΙΑΣ
  const speakWord = (text: string) => {
    const langCode = langCodeMap[activeLang] ?? 'en-US';
    Speech.speak(text, { language: langCode, pitch: 1.0, rate: 0.9 });
  };
  
  const filtered = objects.filter((o) => o[activeLang as keyof ObjectRow]);

  const renderItem = ({ item }: { item: ObjectRow }) => {
    const translation = item[activeLang as keyof ObjectRow] as string;
    const lang = languages.find((l) => l.id === activeLang);

    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.grWord}>🇬🇷 {item.objectNameGr}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.translation}>{lang?.flag} {translation}</Text>
          <TouchableOpacity
            style={styles.speakButton}
            onPress={() => speakWord(translation)}
          >
            <Text style={styles.speakIcon}>🔊</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ιστορικό Σκαναρισμάτων</Text>

      <View style={styles.tabs}>
        {languages.map((lang) => {
          const count = objects.filter((o) => o[lang.id as keyof ObjectRow]).length;
          return (
            <TouchableOpacity
              key={lang.id}
              style={[styles.tab, activeLang === lang.id && styles.activeTab]}
              onPress={() => setActiveLang(lang.id)}
            >
              <Text style={styles.tabFlag}>{lang.flag}</Text>
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.empty}>
            Δεν έχεις σκανάρει λέξεις στα {languages.find((l) => l.id === activeLang)?.name}!
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1D1D21', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 15, textAlign: 'center', color: '#fff' },
  tabs: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20, backgroundColor: '#2e2e33', borderRadius: 15, padding: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 10, position: 'relative' },
  activeTab: { backgroundColor: '#3e3e44', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabFlag: { fontSize: 26 },
  badge: { position: 'absolute', top: 0, right: 8, backgroundColor: '#007AFF', borderRadius: 10, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 15 },
  empty: { textAlign: 'center', color: '#ccc', fontSize: 16 },
  list: { flex: 1, backgroundColor: '#1D1D21' },
  card: { backgroundColor: '#2e2e33', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  grWord: { fontSize: 16, fontWeight: 'bold', color: '#fff', flex: 1 },
  arrow: { fontSize: 16, color: '#ccc', marginHorizontal: 8 }, translationContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  translation: { fontSize: 16, color: '#7ab8ff', fontWeight: '600', textAlign: 'right', marginRight: 8 },
  speakerButton: { padding: 4, backgroundColor: '#3e3e44', borderRadius: 8 },
  speakerIcon: { fontSize: 16 },speakButton: { backgroundColor: '#1a3a5c', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF', marginLeft: 8 },
  speakIcon: { fontSize: 14 },
});