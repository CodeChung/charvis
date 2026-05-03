import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { loadModel, generate } from './src/llamaService';

type Status = 'loading_model' | 'ready' | 'generating' | 'error';

export default function App() {
  const [status, setStatus] = useState<Status>('loading_model');
  const [statusMessage, setStatusMessage] = useState('Loading model…');
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');

  // Load the model once on mount. The 60% RAM check happens inside loadModel
  // and throws a descriptive error if the budget would be exceeded.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadModel();
        if (!cancelled) {
          setStatus('ready');
          setStatusMessage('Model ready');
        }
      } catch (err) {
        if (!cancelled) {
          setStatus('error');
          setStatusMessage(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = useCallback(async () => {
    const prompt = input.trim();
    if (!prompt || status !== 'ready') return;
    setStatus('generating');
    setResponse('');
    try {
      const text = await generate(prompt);
      setResponse(text);
      setStatus('ready');
    } catch (err) {
      setResponse('');
      setStatus('error');
      setStatusMessage(err instanceof Error ? err.message : String(err));
    }
  }, [input, status]);

  const submitDisabled = status !== 'ready' || input.trim().length === 0;

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Local Llama</Text>
          <View style={styles.statusRow}>
            {status === 'loading_model' || status === 'generating' ? (
              <ActivityIndicator size="small" />
            ) : null}
            <Text
              style={[
                styles.statusText,
                status === 'error' && styles.statusError,
              ]}
            >
              {statusMessage}
            </Text>
          </View>
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Prompt</Text>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask anything…"
            multiline
            editable={status === 'ready'}
          />
          <Pressable
            onPress={onSubmit}
            disabled={submitDisabled}
            style={[styles.button, submitDisabled && styles.buttonDisabled]}
          >
            <Text style={styles.buttonText}>
              {status === 'generating' ? 'Generating…' : 'Send'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.responseBlock}>
          <Text style={styles.label}>Response</Text>
          <ScrollView style={styles.responseScroll}>
            <Text style={styles.responseText} selectable>
              {response || (status === 'generating' ? '…' : '')}
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', marginBottom: 6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontSize: 13, color: '#666' },
  statusError: { color: '#c0392b' },
  inputBlock: { paddingHorizontal: 20, paddingTop: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input: {
    minHeight: 96,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#fafafa',
  },
  button: {
    marginTop: 12,
    backgroundColor: '#111',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#bbb' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  responseBlock: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  responseScroll: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fcfcfc',
  },
  responseText: { fontSize: 16, lineHeight: 22, color: '#222' },
});
