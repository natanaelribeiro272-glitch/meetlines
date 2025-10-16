// Centralized categories constants
// Use these across the app to keep categories in sync

export type CategoryValue =
  | 'festas'
  | 'shows'
  | 'fitness'
  | 'igreja'
  | 'cursos'
  | 'bares'
  | 'boates'
  | 'esportes';

export const CATEGORIES: { value: CategoryValue; label: string }[] = [
  { value: 'festas', label: '🎉 Festas' },
  { value: 'shows', label: '🎤 Shows' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'igreja', label: '🙏 Igreja' },
  { value: 'cursos', label: '📚 Cursos' },
  { value: 'bares', label: '🍻 Bares' },
  { value: 'boates', label: '🪩 Boates' },
  { value: 'esportes', label: '⚽ Esportes' },
];

// Optional normalization for legacy category values used elsewhere
export const NORMALIZE_CATEGORY_MAP: Record<string, CategoryValue> = {
  festas: 'festas',
  shows: 'shows',
  fitness: 'fitness',
  igreja: 'igreja',
  cristao: 'igreja',
  cursos: 'cursos',
  educacao: 'cursos',
  bares: 'bares',
  boates: 'boates',
  balada: 'boates',
  night: 'boates',
  eletronica: 'shows',
  rock: 'shows',
  pop: 'shows',
  forro: 'shows',
  sertanejo: 'shows',
  funk: 'shows',
  samba: 'shows',
  jazz: 'shows',
  musica: 'shows',
  eventos: 'festas',
  esportes: 'esportes',
};
