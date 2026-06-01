export enum MuscleGroup {
  CHEST = 'chest',
  UPPER_CHEST = 'upper-chest',
  LOWER_CHEST = 'lower-chest',

  FRONT_DELTOID = 'front-deltoid',
  SIDE_DELTOID = 'side-deltoid',
  REAR_DELTOID = 'rear-deltoid',

  BICEPS = 'biceps',
  BRACHIALIS = 'brachialis',
  FOREARMS = 'forearms',

  TRICEPS = 'triceps',

  TRAPS = 'traps',
  LATS = 'lats',
  RHOMBOIDS = 'rhomboids',

  UPPER_BACK = 'upper-back',
  LOWER_BACK = 'lower-back',

  ABS = 'abs',
  OBLIQUES = 'obliques',

  GLUTES = 'glutes',

  QUADRICEPS = 'quadriceps',
  HAMSTRINGS = 'hamstrings',

  ADDUCTORS = 'adductors',
  ABDUCTORS = 'abductors',

  CALVES = 'calves',
  TIBIALIS = 'tibialis',

  HIP_FLEXORS = 'hip-flexors',
  SARTORIUS = 'sartorius',
}

export const MUSCLE_GROUP_VIEW: Record<string, 'front' | 'back' | 'both'> = {
  [MuscleGroup.CHEST]: 'front',
  [MuscleGroup.UPPER_CHEST]: 'front',
  [MuscleGroup.LOWER_CHEST]: 'front',
  [MuscleGroup.FRONT_DELTOID]: 'front',
  [MuscleGroup.SIDE_DELTOID]: 'both',
  [MuscleGroup.REAR_DELTOID]: 'back',
  [MuscleGroup.BICEPS]: 'front',
  [MuscleGroup.BRACHIALIS]: 'front',
  [MuscleGroup.FOREARMS]: 'front',
  [MuscleGroup.TRICEPS]: 'back',
  [MuscleGroup.TRAPS]: 'back',
  [MuscleGroup.LATS]: 'back',
  [MuscleGroup.RHOMBOIDS]: 'back',
  [MuscleGroup.UPPER_BACK]: 'back',
  [MuscleGroup.LOWER_BACK]: 'back',
  [MuscleGroup.ABS]: 'front',
  [MuscleGroup.OBLIQUES]: 'front',
  [MuscleGroup.GLUTES]: 'back',
  [MuscleGroup.QUADRICEPS]: 'front',
  [MuscleGroup.HAMSTRINGS]: 'back',
  [MuscleGroup.ADDUCTORS]: 'front',
  [MuscleGroup.ABDUCTORS]: 'front',
  [MuscleGroup.CALVES]: 'back',
  [MuscleGroup.TIBIALIS]: 'front',
  [MuscleGroup.HIP_FLEXORS]: 'front',
  [MuscleGroup.SARTORIUS]: 'back',
};

export const MUSCLE_SVG_IDS: Record<MuscleGroup, string[]> = {
  [MuscleGroup.CHEST]: ['pectorals'],
  [MuscleGroup.UPPER_CHEST]: ['pectorals'],
  [MuscleGroup.LOWER_CHEST]: ['pectorals'],

  [MuscleGroup.FRONT_DELTOID]: ['deltoids-front', 'deltoids-front-right'],
  [MuscleGroup.SIDE_DELTOID]: ['deltoids-front', 'deltoids-front-right', 'deltoids-back-left', 'deltoids-back-right'],
  [MuscleGroup.REAR_DELTOID]: ['deltoids-back-left', 'deltoids-back-right'],

  [MuscleGroup.BICEPS]: ['biceps-left', 'biceps-right'],
  [MuscleGroup.BRACHIALIS]: ['biceps-left', 'biceps-right'],
  [MuscleGroup.FOREARMS]: ['forearms-left', 'forearms-right', 'forearms-back-left', 'forearms-back-right'],

  [MuscleGroup.TRICEPS]: ['triceps-left', 'triceps-right'],

  [MuscleGroup.TRAPS]: ['trapezius'],
  [MuscleGroup.LATS]: ['latissimus-dorsi'],
  [MuscleGroup.RHOMBOIDS]: ['trapezius'],

  [MuscleGroup.UPPER_BACK]: ['trapezius'],
  [MuscleGroup.LOWER_BACK]: ['lower-back'],

  [MuscleGroup.ABS]: ['abs'],
  [MuscleGroup.OBLIQUES]: ['obliques-left', 'obliques-right'],

  [MuscleGroup.GLUTES]: ['glutes'],

  [MuscleGroup.QUADRICEPS]: ['quadriceps-left', 'quadriceps-right'],
  [MuscleGroup.HAMSTRINGS]: ['hamstrings-left', 'hamstrings-right'],

  [MuscleGroup.ADDUCTORS]: ['adductors'],
  [MuscleGroup.ABDUCTORS]: ['abductors'],

  [MuscleGroup.CALVES]: ['calves-front-left', 'calves-front-right', 'calves-back-left', 'calves-back-right'],
  [MuscleGroup.TIBIALIS]: ['tibialis-anterior'],

  [MuscleGroup.HIP_FLEXORS]: ['hip-flexors'],
  [MuscleGroup.SARTORIUS]: ['sartorius'],
};

export const MUSCLE_GROUP_TO_ANATOMY: Record<string, MuscleGroup[]> = {
  'Chest': [
    MuscleGroup.CHEST,
    MuscleGroup.UPPER_CHEST,
    MuscleGroup.LOWER_CHEST,
  ],
  'Back': [
    MuscleGroup.LATS,
    MuscleGroup.TRAPS,
    MuscleGroup.RHOMBOIDS,
    MuscleGroup.UPPER_BACK,
    MuscleGroup.LOWER_BACK,
  ],
  'Shoulders': [
    MuscleGroup.FRONT_DELTOID,
    MuscleGroup.SIDE_DELTOID,
    MuscleGroup.REAR_DELTOID,
  ],
  'Biceps': [
    MuscleGroup.BICEPS,
    MuscleGroup.BRACHIALIS,
  ],
  'Triceps': [
    MuscleGroup.TRICEPS,
  ],
  'Legs': [
    MuscleGroup.QUADRICEPS,
    MuscleGroup.HAMSTRINGS,
    MuscleGroup.GLUTES,
    MuscleGroup.CALVES,
    MuscleGroup.ADDUCTORS,
  ],
  'Quadriceps': [
    MuscleGroup.QUADRICEPS,
    MuscleGroup.ADDUCTORS,
  ],
  'Hamstrings': [
    MuscleGroup.HAMSTRINGS,
    MuscleGroup.GLUTES,
  ],
  'Glutes': [
    MuscleGroup.GLUTES,
    MuscleGroup.HAMSTRINGS,
  ],
  'Calves': [
    MuscleGroup.CALVES,
  ],
  'Core': [
    MuscleGroup.ABS,
    MuscleGroup.OBLIQUES,
  ],
  'Abs': [
    MuscleGroup.ABS,
    MuscleGroup.OBLIQUES,
  ],
  'Obliques': [
    MuscleGroup.OBLIQUES,
    MuscleGroup.ABS,
  ],
  'Forearms': [
    MuscleGroup.FOREARMS,
    MuscleGroup.BRACHIALIS,
  ],
  'Traps': [
    MuscleGroup.TRAPS,
    MuscleGroup.UPPER_BACK,
  ],
  'Full Body': [
    MuscleGroup.CHEST,
    MuscleGroup.UPPER_CHEST,
    MuscleGroup.LATS,
    MuscleGroup.TRAPS,
    MuscleGroup.FRONT_DELTOID,
    MuscleGroup.SIDE_DELTOID,
    MuscleGroup.REAR_DELTOID,
    MuscleGroup.BICEPS,
    MuscleGroup.TRICEPS,
    MuscleGroup.QUADRICEPS,
    MuscleGroup.HAMSTRINGS,
    MuscleGroup.GLUTES,
    MuscleGroup.CALVES,
    MuscleGroup.ABS,
    MuscleGroup.OBLIQUES,
  ],
  'Cardio': [
    MuscleGroup.QUADRICEPS,
    MuscleGroup.HAMSTRINGS,
    MuscleGroup.GLUTES,
    MuscleGroup.CALVES,
    MuscleGroup.ABS,
  ],
};

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = Object.values(MuscleGroup);

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  [MuscleGroup.CHEST]: 'Pectorales',
  [MuscleGroup.UPPER_CHEST]: 'Pectoral Superior',
  [MuscleGroup.LOWER_CHEST]: 'Pectoral Inferior',
  [MuscleGroup.FRONT_DELTOID]: 'Deltoides Frontal',
  [MuscleGroup.SIDE_DELTOID]: 'Deltoides Lateral',
  [MuscleGroup.REAR_DELTOID]: 'Deltoides Posterior',
  [MuscleGroup.BICEPS]: 'Bíceps',
  [MuscleGroup.BRACHIALIS]: 'Braquial',
  [MuscleGroup.FOREARMS]: 'Antebrazos',
  [MuscleGroup.TRICEPS]: 'Tríceps',
  [MuscleGroup.TRAPS]: 'Trapecio',
  [MuscleGroup.LATS]: 'Dorsales',
  [MuscleGroup.RHOMBOIDS]: 'Romboides',
  [MuscleGroup.UPPER_BACK]: 'Espalda Alta',
  [MuscleGroup.LOWER_BACK]: 'Espalda Baja',
  [MuscleGroup.ABS]: 'Abdominales',
  [MuscleGroup.OBLIQUES]: 'Oblicuos',
  [MuscleGroup.GLUTES]: 'Glúteos',
  [MuscleGroup.QUADRICEPS]: 'Cuádriceps',
  [MuscleGroup.HAMSTRINGS]: 'Isquiotibiales',
  [MuscleGroup.ADDUCTORS]: 'Aductores',
  [MuscleGroup.ABDUCTORS]: 'Abductores',
  [MuscleGroup.CALVES]: 'Gemelos',
  [MuscleGroup.TIBIALIS]: 'Tibial Anterior',
  [MuscleGroup.HIP_FLEXORS]: 'Flexores de Cadera',
  [MuscleGroup.SARTORIUS]: 'Sartorio',
};
