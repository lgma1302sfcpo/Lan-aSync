import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import FotoRegistro from '../database/models/FotoRegistro';
import Registro from '../database/models/Registro';

type Props = {
  registro: Registro;
  onDelete: (registro: Registro) => void;
  onEdit: (registro: Registro) => void;
};

function formatDate(value: number) {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function RegistroItem({ registro, onDelete, onEdit }: Props) {
  const [fotos, setFotos] = useState<FotoRegistro[]>([]);
  const status = (registro as unknown as { _raw: { _status: string } })._raw._status;
  const statusLabel = status === 'synced' ? 'Sincronizado' : 'Pendente';

  useEffect(() => {
    const subscription = registro.fotos.observe().subscribe(setFotos);
    return () => subscription.unsubscribe();
  }, [registro]);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.tipo}>{registro.tipo === 'COMPRA' ? 'Compra' : 'Venda'}</Text>
        <Text style={[styles.status, status === 'synced' ? styles.synced : styles.pending]}>
          {statusLabel}
        </Text>
      </View>

      <Text style={styles.data}>{formatDate(registro.dataHora)}</Text>
      <Text style={styles.descricao}>{registro.descricao}</Text>

      {fotos.length > 0 ? (
        <View style={styles.photos}>
          {fotos.slice(0, 4).map(foto => (
            <Image
              key={foto.id}
              source={{ uri: foto.remoteUrl || foto.localUri }}
              style={styles.photo}
            />
          ))}
          {fotos.length > 4 ? <Text style={styles.more}>+{fotos.length - 4}</Text> : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={() => onEdit(registro)} style={styles.editButton}>
          <Text style={styles.editButtonText}>Editar</Text>
        </Pressable>
        <Pressable onPress={() => onDelete(registro)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#d8dee9',
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    padding: 12,
  },
  data: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 6,
  },
  descricao: {
    color: '#1f2937',
    fontSize: 15,
    lineHeight: 21,
  },
  deleteButton: {
    alignItems: 'center',
    borderColor: '#ef4444',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  deleteButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  editButton: {
    alignItems: 'center',
    backgroundColor: '#eef2ff',
    borderRadius: 8,
    flex: 1,
    height: 38,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#1d4ed8',
    fontWeight: '700',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  more: {
    alignSelf: 'center',
    color: '#475569',
    fontWeight: '700',
    marginLeft: 8,
  },
  pending: {
    backgroundColor: '#fff7ed',
    color: '#c2410c',
  },
  photo: {
    borderRadius: 6,
    height: 54,
    marginRight: 6,
    width: 54,
  },
  photos: {
    flexDirection: 'row',
    marginTop: 10,
  },
  status: {
    borderRadius: 6,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  synced: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
  },
  tipo: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
});
