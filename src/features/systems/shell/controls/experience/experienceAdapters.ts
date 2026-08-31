import AsyncStorage from '@react-native-async-storage/async-storage'
import type { ExperienceMode } from '../../../../components/shell/controls/experience/experienceTypes'

const EXPERIENCE_KEY = 'portfolio.experienceMode'
const MODES: readonly ExperienceMode[] = ['cinematic', 'quiet']

const isExperienceMode = (value: string | null): value is ExperienceMode =>
  MODES.some((mode) => mode === value)

export const loadStoredExperience = async (): Promise<ExperienceMode | null> =>
  Promise.resolve()
    .then(() => AsyncStorage.getItem(EXPERIENCE_KEY))
    .then((value) => (isExperienceMode(value) ? value : null))
    .catch(() => null)

export const saveStoredExperience = (mode: ExperienceMode): Promise<void> =>
  Promise.resolve()
    .then(() => AsyncStorage.setItem(EXPERIENCE_KEY, mode))
    .catch(() => undefined)
