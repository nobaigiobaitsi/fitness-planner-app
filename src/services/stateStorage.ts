import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { AppState } from '@/types/domain';

const STORAGE_KEY = 'fitplanner.app-state.v1';
const STATE_FILE_NAME = 'fitplanner-state-v1.json';

type StoredPayload = {
  version: 1;
  state: AppState;
};

function getStateFile() {
  return new File(Paths.document, STATE_FILE_NAME);
}

function isStoredPayload(value: unknown): value is StoredPayload {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<StoredPayload>;
  return (
    payload.version === 1 &&
    !!payload.state &&
    Array.isArray(payload.state.workouts) &&
    Array.isArray(payload.state.favoriteExerciseIds) &&
    Array.isArray(payload.state.history)
  );
}

export async function loadAppState(): Promise<AppState | null> {
  try {
    let raw: string | null = null;

    if (Platform.OS === 'web') {
      raw = globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
    } else {
      const file = getStateFile();
      raw = file.exists ? await file.text() : null;
    }

    if (!raw) return null;
    const payload: unknown = JSON.parse(raw);
    return isStoredPayload(payload) ? payload.state : null;
  } catch {
    return null;
  }
}

export async function saveAppState(state: AppState) {
  const payload: StoredPayload = { version: 1, state };
  const raw = JSON.stringify(payload);

  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(STORAGE_KEY, raw);
    return;
  }

  const file = getStateFile();
  if (!file.exists) file.create({ intermediates: true });
  file.write(raw);
}
