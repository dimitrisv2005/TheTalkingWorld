import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View
} from 'react-native';
import { getAllObjects, saveTest } from '../../services/database';





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
  const [answered, setAnswered] = useState<boolean | null>(null); // null=αναμονή, true=σωστό, false=λάθος

  useFocusEffect(
    useCallback(() => {
      setPhase('select');
      setSelectedLang(null);
      setScore(0);
      setCurrent(0);
    }, [])
  );

  const startQuiz = () => {
    if (!selectedLang) return;

    const allObjects: ObjectRow[] = getAllObjects();
    const col = langMap[selectedLang];

    // Κρατάμε μόνο αντικείμενα που έχουν μετάφραση στη γλώσσα
    const valid = allObjects.filter((o) => o[col]);

    if (valid.length < 2) {
      Alert.alert('Λίγες λέξεις', `Χρειάζεσαι τουλάχιστον 2 λέξεις στα ${selectedLang}. Σκάναρε περισσότερα αντικείμενα!`);
      return;
    }

    const allTranslations = valid.map((o) => o[col] as string);

    const qs: Question[] = valid.map((obj, i) => {
      const correct = obj[col] as string;
      const isWrite = i % 2 === 0; // Εναλλάξ τύπος ερώτησης

      // Λάθος επιλογές για multiple choice
      const wrongs = shuffle(allTranslations.filter((t) => t !== correct)).slice(0, 3);
      const choices = shuffle([correct, ...wrongs]);

      return {
        gr: obj.objectNameGr,
        correct,
        choices,
        type: isWrite ? 'write' : 'choice',
      };
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
    saveTest({
      lang: selectedLang!,
      score: score,  // ← απλά score, όχι score + 1
      total: questions.length,
    });
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
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>📝 Τεστ Γνώσεων</Text>
        <Text style={styles.subtitle}>Επίλεξε γλώσσα για το τεστ:</Text>

        <View style={styles.grid}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.id}
              style={[styles.flagCard, selectedLang === lang.id && styles.selectedCard]}
              onPress={() => setSelectedLang(lang.id)}
            >
              <Text style={styles.flagEmoji}>{lang.flag}</Text>
              <Text style={styles.langName}>{lang.name}</Text>
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


      </ScrollView>
    );
  }

  // ── ΦΑΣΗ 3: Αποτελέσματα ──
  if (phase === 'results') {
    const percent = Math.round((score / questions.length) * 100);
    const emoji = percent >= 80 ? '🎉' : percent >= 50 ? '😊' : '💪';

    return (
      <View style={styles.container}>
        <Text style={styles.resultEmoji}>{emoji}</Text>
        <Text style={styles.title}>Αποτελέσματα</Text>
        <Text style={styles.scoreText}>{score} / {questions.length} σωστά</Text>
        <Text style={styles.percentText}>{percent}%</Text>

        <TouchableOpacity style={styles.startButton} onPress={() => setPhase('select')}>
          <Text style={styles.startButtonText}>Νέο Τεστ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── ΦΑΣΗ 2: Quiz ──
  const q = questions[current];
  const feedbackColor = answered === null ? '#fff' : answered ? '#d4edda' : '#f8d7da';

  return (
    <View style={[styles.container, { backgroundColor: feedbackColor }]}>
      {/* Progress */}
      <Text style={styles.progress}>{current + 1} / {questions.length}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
      </View>

      {/* Ερώτηση */}
      <View style={styles.questionBox}>
        <Text style={styles.questionLabel}>Πώς λέγεται στα {selectedLang};</Text>
        <Text style={styles.questionWord}>🇬🇷 {q.gr}</Text>
      </View>

      {/* Multiple Choice */}
      {q.type === 'choice' && (
        <View style={styles.choicesGrid}>
          {q.choices.map((choice) => {
            let btnStyle = styles.choiceBtn;
            if (answered !== null) {
              if (choice === q.correct) btnStyle = { ...styles.choiceBtn, ...styles.correctBtn };
              else btnStyle = { ...styles.choiceBtn, ...styles.wrongBtn };
            }
            return (
              <TouchableOpacity
                key={choice}
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

      {/* Write Answer */}
      {q.type === 'write' && (
        <View style={styles.writeContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={`Γράψε στα ${selectedLang}...`}
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

      {/* Feedback */}
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
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D1D21', padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginBottom: 25, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  flagCard: { width: 140, height: 140, backgroundColor: '#f8f9fa', margin: 10, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  selectedCard: { backgroundColor: '#d0eaff', borderWidth: 2, borderColor: '#007AFF' },
  flagEmoji: { fontSize: 50, marginBottom: 10 },
  langName: { fontSize: 16, fontWeight: '600', color: '#333' },
  startButton: { marginTop: 10, backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 60, borderRadius: 12, width: '100%', alignItems: 'center' },
  disabledButton: { backgroundColor: '#aaa' },
  startButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  progress: { fontSize: 14, color: '#888', marginBottom: 8, alignSelf: 'flex-end' },
  progressBar: { width: '100%', height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 30 },
  progressFill: { height: 8, backgroundColor: '#007AFF', borderRadius: 4 },
  questionBox: { backgroundColor: '#f0f7ff', borderRadius: 16, padding: 20, width: '100%', alignItems: 'center', marginBottom: 25 },
  questionLabel: { fontSize: 14, color: '#888', marginBottom: 8 },
  questionWord: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  choicesGrid: { width: '100%', gap: 10 },
  choiceBtn: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0' },
  correctBtn: { backgroundColor: '#d4edda', borderColor: '#28a745' },
  wrongBtn: { backgroundColor: '#f8d7da', borderColor: '#dc3545' },
  choiceText: { fontSize: 18, fontWeight: '600', color: '#333' },
  writeContainer: { width: '100%', gap: 10 },
  input: { backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 12, padding: 15, fontSize: 18, width: '100%' },
  submitBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  feedback: { marginTop: 20, alignItems: 'center', width: '100%', gap: 12 },
  feedbackText: { fontSize: 18, fontWeight: '600', color: '#333' },
  nextBtn: { backgroundColor: '#007AFF', paddingVertical: 12, paddingHorizontal: 40, borderRadius: 12 },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultEmoji: { fontSize: 70, marginBottom: 15 },
  scoreText: { fontSize: 28, fontWeight: 'bold', color: '#333', marginTop: 10 },
  percentText: { fontSize: 48, fontWeight: 'bold', color: '#007AFF', marginVertical: 10 }
});