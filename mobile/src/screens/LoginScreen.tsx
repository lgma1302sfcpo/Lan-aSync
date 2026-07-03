import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { login } from '../services/auth';
import type { Session } from '../types/session';

type Props = {
  onLogin: (session: Session) => void;
};

export function LoginScreen({ onLogin }: Props) {
  const [loginInput, setLoginInput] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!loginInput.trim() || !senha.trim()) {
      Alert.alert('Campos obrigatorios', 'Informe usuario e senha.');
      return;
    }

    try {
      setLoading(true);
      const session = await login(loginInput.trim(), senha);
      onLogin(session);
    } catch (error) {
      Alert.alert('Login nao realizado', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.panel}>
        <Text style={styles.title}>Entrar</Text>
        <Text style={styles.subtitle}>Acesse os lancamentos da sua empresa.</Text>

        <Text style={styles.label}>Usuario</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          onChangeText={setLoginInput}
          placeholder="email ou login"
          style={styles.input}
          value={loginInput}
        />

        <Text style={styles.label}>Senha</Text>
        <TextInput
          onChangeText={setSenha}
          placeholder="senha"
          secureTextEntry
          style={styles.input}
          value={senha}
        />

        <Pressable disabled={loading} onPress={handleLogin} style={styles.button}>
          {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Entrar</Text>}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    marginTop: 14,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#f3f4f6',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    height: 48,
    paddingHorizontal: 12,
  },
  label: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  panel: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderRadius: 8,
    borderWidth: 1,
    padding: 18,
  },
  subtitle: {
    color: '#64748b',
    marginTop: 4,
  },
  title: {
    color: '#0f172a',
    fontSize: 28,
    fontWeight: '800',
  },
});
