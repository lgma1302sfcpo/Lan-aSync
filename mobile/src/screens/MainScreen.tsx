import NetInfo from '@react-native-community/netinfo';
import { Picker } from '@react-native-picker/picker';
import { Q } from '@nozbe/watermelondb';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Asset, ImagePickerResponse, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { RegistroItem } from '../components/RegistroItem';
import { database } from '../database';
import FotoRegistro from '../database/models/FotoRegistro';
import Registro from '../database/models/Registro';
import { clearSession } from '../services/sessionStorage';
import { syncDatabase } from '../services/sync';
import { createId } from '../services/uuid';
import type { Session } from '../types/session';

type Props = {
  session: Session;
  onLogout: () => void;
};

function formatDateOnly(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()}`;
}

function formatTimeOnly(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function maskDate(value: string) {
  const digits = onlyDigits(value).slice(0, 8);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskTime(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

function parseDateTime(dateInput: string, timeInput: string) {
  const dateMatch = dateInput.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const timeMatch = timeInput.trim().match(/^(\d{2}):(\d{2})$/);

  if (!dateMatch || !timeMatch) {
    return null;
  }

  const day = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const parsed = new Date(year, month - 1, day, hour, minute);

  const isValid =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day &&
    parsed.getHours() === hour &&
    parsed.getMinutes() === minute;

  return isValid ? parsed : null;
}

export function MainScreen({ session, onLogout }: Props) {
  const [tipo, setTipo] = useState<'COMPRA' | 'VENDA'>('COMPRA');
  const [dataInput, setDataInput] = useState(formatDateOnly(new Date()));
  const [horaInput, setHoraInput] = useState(formatTimeOnly(new Date()));
  const [descricao, setDescricao] = useState('');
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [editingRegistro, setEditingRegistro] = useState<Registro | null>(null);
  const [syncing, setSyncing] = useState(false);
  const syncingRef = useRef(false);

  useEffect(() => {
    const subscription = database.collections
      .get<Registro>('registros')
      .query(
        Q.where('empresa_id', session.usuario.empresa_id),
        Q.sortBy('data_hora', Q.desc),
      )
      .observe()
      .subscribe(setRegistros);

    return () => subscription.unsubscribe();
  }, [session.usuario.empresa_id]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected && state.isInternetReachable !== false;
      if (online) {
        handleSync(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function handleSync(showFeedback = true) {
    if (syncingRef.current) {
      return;
    }

    try {
      syncingRef.current = true;
      setSyncing(true);
      await syncDatabase();
      if (showFeedback) {
        Alert.alert('Sincronizacao concluida');
      }
    } catch (error) {
      if (showFeedback) {
        Alert.alert(
          'Sincronizacao nao realizada',
          error instanceof Error ? error.message : 'Verifique a conexao.',
        );
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
    }
  }

  async function addFromGallery() {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 0,
    });

    handlePhotoResult(result);
  }

  function handlePhotoResult(result: ImagePickerResponse) {
    if (result.didCancel) {
      return;
    }

    if (result.errorCode) {
      Alert.alert(
        'Foto nao adicionada',
        result.errorMessage || 'Nao foi possivel abrir a camera ou galeria.',
      );
      return;
    }

    if (result.assets?.length) {
      setPhotos(current => [...current, ...result.assets!]);
    }
  }

  async function requestCameraPermission() {
    if (Platform.OS !== 'android') {
      return true;
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Permissao da camera',
        message: 'O app precisa acessar a camera para tirar fotos do lancamento.',
        buttonPositive: 'Permitir',
        buttonNegative: 'Cancelar',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  async function addFromCamera() {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permissao negada', 'Autorize o acesso a camera para tirar fotos.');
      return;
    }

    const result = await launchCamera({
      mediaType: 'photo',
      cameraType: 'back',
      quality: 0.8,
    });

    handlePhotoResult(result);
  }

  function handleDateChange(value: string) {
    setDataInput(maskDate(value));
  }

  function handleTimeChange(value: string) {
    setHoraInput(maskTime(value));
  }

  function clearForm() {
    setTipo('COMPRA');
    setDataInput(formatDateOnly(new Date()));
    setHoraInput(formatTimeOnly(new Date()));
    setDescricao('');
    setPhotos([]);
    setEditingRegistro(null);
  }

  function handleEdit(registro: Registro) {
    const date = new Date(registro.dataHora);
    setEditingRegistro(registro);
    setTipo(registro.tipo);
    setDataInput(formatDateOnly(date));
    setHoraInput(formatTimeOnly(date));
    setDescricao(registro.descricao);
    setPhotos([]);
  }

  function handleDelete(registro: Registro) {
    Alert.alert(
      'Excluir registro',
      'Deseja excluir este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await database.write(async () => {
              const fotos = await registro.fotos.fetch();

              for (const foto of fotos) {
                await foto.markAsDeleted();
              }

              await registro.markAsDeleted();
            });

            if (editingRegistro?.id === registro.id) {
              clearForm();
            }
          },
        },
      ],
    );
  }

  async function handleSave() {
    if (!tipo) {
      Alert.alert('Campo obrigatorio', 'Selecione compra ou venda.');
      return;
    }

    if (descricao.trim().length < 10) {
      Alert.alert('Descricao invalida', 'Digite pelo menos 10 caracteres.');
      return;
    }

    const selectedDate = parseDateTime(dataInput, horaInput);
    if (!selectedDate) {
      Alert.alert('Data invalida', 'Informe a data como DD/MM/AAAA e a hora como HH:MM.');
      return;
    }

    const registroId = createId();
    const now = Date.now();
    const registroCollection = database.collections.get<Registro>('registros');
    const fotoCollection = database.collections.get<FotoRegistro>('fotos_registro');

    await database.write(async () => {
      const currentRegistroId = editingRegistro?.id || registroId;

      if (editingRegistro) {
        await editingRegistro.update(item => {
          item.tipo = tipo;
          item.dataHora = selectedDate.getTime();
          item.descricao = descricao.trim();
        });
      } else {
        await registroCollection.create(item => {
          (item as unknown as { _raw: { id: string } })._raw.id = currentRegistroId;
          item.empresaId = session.usuario.empresa_id;
          item.usuarioId = session.usuario.id;
          item.tipo = tipo;
          item.dataHora = selectedDate.getTime();
          item.descricao = descricao.trim();
          (item as unknown as { _raw: { created_at: number; updated_at: number } })._raw.created_at = now;
          (item as unknown as { _raw: { created_at: number; updated_at: number } })._raw.updated_at = now;
        });
      }

      for (const photo of photos) {
        await fotoCollection.create(item => {
          (item as unknown as { _raw: { id: string } })._raw.id = createId();
          item.registroId = currentRegistroId;
          item.empresaId = session.usuario.empresa_id;
          item.localUri = photo.uri || '';
          item.remoteUrl = '';
          item.nomeArquivo = photo.fileName || 'foto.jpg';
          item.mimeType = photo.type || 'image/jpeg';
          (item as unknown as { _raw: { created_at: number; updated_at: number } })._raw.created_at = now;
          (item as unknown as { _raw: { created_at: number; updated_at: number } })._raw.updated_at = now;
        });
      }
    });

    clearForm();
    Alert.alert(
      editingRegistro ? 'Registro atualizado' : 'Registro salvo',
      editingRegistro ? 'O lancamento foi atualizado localmente.' : 'O lancamento foi salvo localmente.',
    );
  }

  async function handleLogout() {
    await clearSession();
    onLogout();
  }

  return (
    <View style={styles.container}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.company}>{session.usuario.empresa.nome}</Text>
          <Text style={styles.user}>{session.usuario.nome}</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Sair</Text>
        </Pressable>
      </View>

      <FlatList
        ListHeaderComponent={
          <View style={styles.form}>
            <Text style={styles.sectionTitle}>
              {editingRegistro ? 'Editar lancamento' : 'Novo lancamento'}
            </Text>

            <Text style={styles.label}>Tipo</Text>
            <View style={styles.pickerBox}>
              <Picker selectedValue={tipo} onValueChange={value => setTipo(value as 'COMPRA' | 'VENDA')}>
                <Picker.Item label="Compra" value="COMPRA" />
                <Picker.Item label="Venda" value="VENDA" />
              </Picker>
            </View>

            <Text style={styles.label}>Data e hora</Text>
            <View style={styles.row}>
              <TextInput
                keyboardType="numeric"
                maxLength={10}
                onChangeText={handleDateChange}
                placeholder="DD/MM/AAAA"
                style={styles.dateInput}
                value={dataInput}
              />
              <TextInput
                keyboardType="numeric"
                maxLength={5}
                onChangeText={handleTimeChange}
                placeholder="HH:MM"
                style={styles.timeInput}
                value={horaInput}
              />
            </View>

            <Text style={styles.label}>Descricao</Text>
            <TextInput
              multiline
              onChangeText={setDescricao}
              placeholder="Descreva o lancamento"
              style={styles.textArea}
              value={descricao}
            />

            <Text style={styles.label}>Fotos</Text>
            <View style={styles.row}>
              <Pressable onPress={addFromGallery} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Galeria</Text>
              </Pressable>
              <Pressable onPress={addFromCamera} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Camera</Text>
              </Pressable>
            </View>

            {photos.length > 0 ? (
              <View style={styles.previewList}>
                {photos.map((photo, index) => (
                  <Image key={`${photo.uri}-${index}`} source={{ uri: photo.uri }} style={styles.preview} />
                ))}
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable onPress={handleSave} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>
                  {editingRegistro ? 'Atualizar' : 'Salvar'}
                </Text>
              </Pressable>
              {editingRegistro ? (
                <Pressable onPress={clearForm} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </Pressable>
              ) : null}
              <Pressable disabled={syncing} onPress={() => handleSync(true)} style={styles.syncButton}>
                {syncing ? (
                  <ActivityIndicator color="#2563eb" />
                ) : (
                  <Text style={styles.syncButtonText}>Sincronizar</Text>
                )}
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Registros locais</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        data={registros}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <RegistroItem
            onDelete={handleDelete}
            onEdit={handleEdit}
            registro={item}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
    marginTop: 14,
  },
  company: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  cancelButton: {
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#334155',
    fontWeight: '800',
  },
  container: {
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  dateInput: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    color: '#111827',
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  form: {
    paddingTop: 16,
  },
  label: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 10,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pickerBox: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  preview: {
    borderRadius: 6,
    height: 64,
    marginRight: 8,
    width: 64,
  },
  previewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#2563eb',
    borderRadius: 8,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#334155',
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    marginTop: 4,
  },
  smallButton: {
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  smallButtonText: {
    color: '#1d4ed8',
    fontWeight: '800',
  },
  syncButton: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#2563eb',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center',
  },
  syncButtonText: {
    color: '#2563eb',
    fontWeight: '800',
  },
  textArea: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    minHeight: 92,
    padding: 12,
    textAlignVertical: 'top',
  },
  timeInput: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
    borderRadius: 8,
    borderWidth: 1,
    color: '#111827',
    height: 46,
    paddingHorizontal: 12,
    width: 96,
  },
  topbar: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 52,
  },
  user: {
    color: '#64748b',
    marginTop: 2,
  },
});
