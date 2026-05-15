import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { getAllObjects, getTotalScore, saveTest } from '../../services/database';

type ObjectRow = {
  id: number;
  objectNameGr: string;
  objectNameEnglish: string | null;
  objectNameGerman: string | null;
  objectNameFrench: string | null;
  objectNameSpanish: string | null;
};

type Question = {
  gr: string;
  correct: string;
  choices: string[];
  type: 'write' | 'choice';
};

const langMap: { [key: string]: keyof ObjectRow } = {
  English: 'objectNameEnglish',
  German: 'objectNameGerman',
  French: 'objectNameFrench',
  Spanish: 'objectNameSpanish',
};

const languages = [
  { id: 'English', flag: '🇬🇧', name: 'English' },
  { id: 'German',  flag: '🇩🇪', name: 'Deutsch' },
  { id: 'French',  flag: '🇫🇷', name: 'Français' },
  { id: 'Spanish', flag: '🇪🇸', name: 'Español' },
];

const shuffle = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

export default function TestsScreen() {
  const router = useRouter();
  const [phase, setPhase] = useState<'select' | 'quiz' | 'results'>('select');
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<boolean | null>(null);
  const [totalStats, setTotalStats] = useState({ totalScore: 0, totalTests: 0, totalQuestions: 0 });

  useFocusEffect(
    useCallback(() => {
      setPhase('select');
      setScore(0);
      setCurrent(0);
      AsyncStorage.getItem('lastLanguage').then((lang) => {
        if (lang) setSelectedLang(lang);
      });
    }, [])
  );

  const startQuiz = () => {
    if (!selectedLang) return;
    const allObjects: ObjectRow[] = getAllObjects();
    const col = langMap[selectedLang];
    const valid = allObjects.filter((o) => o[col]);

    if (valid.length < 2) {
      Alert.alert('Λίγες λέξεις', `Χρειάζεσαι τουλάχιστον 2 λέξεις στα ${selectedLang}. Σκάναρε περισσότερα αντικείμενα!`);
      return;
    }

    const allTranslations = valid.map((o) => o[col] as string);
    const qs: Question[] = valid.map((obj, i) => {
      const correct = obj[col] as string;
      const isWrite = i % 2 === 0;
      const wrongs = shuffle(allTranslations.filter((t) => t !== correct)).slice(0, 3);
      const choices = shuffle([correct, ...wrongs]);
      return { gr: obj.objectNameGr, correct, choices, type: isWrite ? 'write' : 'choice' };
    });

    setQuestions(shuffle(qs));
    setCurrent(0);
    setScore(0);
    setInput('');
    setAnswered(null);
    setPhase('quiz');
  };

  const handleAnswer = (answer: string) => {
    const isCorrect = answer.trim().toLowerCase() === questions[current].correct.toLowerCase();
    setAnswered(isCorrect);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= questions.length) {
      saveTest({ lang: selectedLang!, score, total: questions.length });
      setTotalStats(getTotalScore());
      setPhase('results');
    } else {
      setCurrent((c) => c + 1);
      setAnswered(null);
      setInput('');
    }
  };

  // ── ΦΑΣΗ 1: Επιλογή γλώσσας ──
  if (phase === 'select') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>📝 Τεστ Γνώσεων</Text>
        <Text style={styles.subtitle}>Επίλεξε γλώσσα για το τεστ:</Text>

        <View style={styles.langList}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.langRow, selectedLang === lang.id && styles.selectedRow]}
              onPress={() => setSelectedLang(lang.id)}
            >
              <Text style={styles.flagEmoji}>{lang.flag}</Text>
              <Text style={styles.langName}>{lang.name}</Text>
              {selectedLang === lang.id && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.startButton, !selectedLang && styles.disabledButton]}
          onPress={startQuiz}
          disabled={!selectedLang}
        >
          <Text style={styles.startButtonText}>Έναρξη Τεστ →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ΦΑΣΗ 3: Αποτελέσματα ──
if (phase === 'results') {
  const percent = Math.round((score / questions.length) * 100);
  const emoji = percent >= 80 ? '🎉' : percent >= 50 ? '👍' : '💪';

  return (
    <View style={styles.container}>
      <View style={styles.resultBox}>
        <Text style={styles.resultEmoji}>{emoji}</Text>
        <Text style={styles.title}>Αποτελέσματα</Text>
        <View style={styles.divider} />
        <Text style={styles.scoreText}>{score} / {questions.length} σωστά</Text>
        <Text style={styles.percentText}>{percent}%</Text>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={() => setPhase('select')}>
        <Text style={styles.startButtonText}>Νέο Τεστ</Text>
      </TouchableOpacity>
    </View>
  );
}



  // ── ΦΑΣΗ 2: Quiz ──
  const q = questions[current];
  const feedbackColor = answered === null ? '#1D1D21' : answered ? '#1a3a2a' : '#3a1a1a';

  return (
    <View style={[styles.container, { backgroundColor: feedbackColor }]}>
      <Text style={styles.progress}>{current + 1} / {questions.length}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      <View style={styles.questionBox}>
        <Text style={styles.questionLabel}>Πώς λέγεται στα {selectedLang};</Text>
        <Text style={styles.questionWord}>🇬🇷 {q.gr}</Text>
      </View>

      {q.type === 'choice' && (
        <View style={styles.choicesGrid}>
          {q.choices.map((choice, index) => {
            let btnStyle = styles.choiceBtn;
            if (answered !== null) {
              if (choice === q.correct) btnStyle = { ...styles.choiceBtn, ...styles.correctBtn };
              else btnStyle = { ...styles.choiceBtn, ...styles.wrongBtn };
            }
            return (
              <TouchableOpacity
                key={`${choice}-${index}`}
                style={btnStyle}
                onPress={() => answered === null && handleAnswer(choice)}
                disabled={answered !== null}
              >
                <Text style={styles.choiceText}>{choice}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {q.type === 'write' && (
        <View style={styles.writeContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Γράψε στα ${selectedLang}...`}
            placeholderTextColor="#888"
            editable={answered === null}
            autoCapitalize="none"
          />
          {answered === null && (
            <TouchableOpacity style={styles.submitBtn} onPress={() => handleAnswer(input)}>
              <Text style={styles.submitBtnText}>Απάντηση</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {answered !== null && (
        <View style={styles.feedback}>
          <Text style={styles.feedbackText}>
            {answered ? '✅ Σωστό!' : `❌ Λάθος! Σωστό: ${q.correct}`}
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {current + 1 >= questions.length ? 'Τέλος →' : 'Επόμενο →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D1D21', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#aaa', marginBottom: 25, textAlign: 'center' },
  langList: { width: '100%', marginBottom: 20 },
  langRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2e2e33', padding: 18, borderRadius: 14, marginBottom: 12, borderWidth: 1, borderColor: '#3e3e44' },
  selectedRow: { backgroundColor: '#1a3a5c', borderColor: '#007AFF' },
  flagEmoji: { fontSize: 32, marginRight: 15 },
  langName: { fontSize: 18, fontWeight: '600', color: '#fff', flex: 1 },
  checkmark: { fontSize: 20, color: '#007AFF', fontWeight: 'bold' },
  startButton: { marginTop: 15, backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 12, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#444' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  progress: { fontSize: 14, color: '#aaa', marginBottom: 8, alignSelf: 'flex-end' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#2e2e33', borderRadius: 4, marginBottom: 30 },
  progressFill: { height: 8, backgroundColor: '#007AFF', borderRadius: 4 },
  questionBox: { backgroundColor: '#2e2e33', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', marginBottom: 25 },
  questionLabel: { fontSize: 14, color: '#aaa', marginBottom: 8 },
  questionWord: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  choicesGrid: { width: '100%', gap: 10 },
  choiceBtn: { backgroundColor: '#2e2e33', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#3e3e44' },
  correctBtn: { backgroundColor: '#1a3a2a', borderColor: '#28a745' },
  wrongBtn: { backgroundColor: '#3a1a1a', borderColor: '#dc3545' },
  choiceText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  writeContainer: { width: '100%', gap: 10 },
  input: { backgroundColor: '#2e2e33', borderWidth: 1, borderColor: '#3e3e44', borderRadius: 12, padding: 15, fontSize: 18, width: '100%', color: '#fff' },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  feedback: { marginTop: 20, alignItems: 'center', width: '100%', gap: 12 },
  feedbackText: { fontSize: 18, fontWeight: '600', color: '#fff' },
  nextBtn: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultBox: { backgroundColor: '#2e2e33', borderRadius: 20, padding: 30, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#3e3e44', marginBottom: 10 },
  divider: { height: 1, backgroundColor: '#3e3e44', width: '100%', marginVertical: 15 },
  resultEmoji: { fontSize: 70, marginBottom: 10 },
  scoreText: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 5 },
  percentText: { fontSize: 48, fontWeight: 'bold', color: '#007AFF', marginVertical: 5 },
  totalLabel: { fontSize: 14, color: '#aaa', marginTop: 4 },
  totalScore: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  totalSub: { fontSize: 13, color: '#888', marginTop: 2 },
});