export const ROOM_DISPLAY_NAMES: Record<string, string> = {
  'Single Bed': 'Single Bed',
  'Double Bed': 'Double Bed',
  'Double Bed + Ensuite': 'Ensuite',
  'Double Bed + Ensuite + Priv Study': 'Ensuite + Private Study',
};

export const ROOM_DISPLAY_DESCRIPTIONS: Record<string, string> = {
  'Single Bed': 'Single bed accommodation',
  'Double Bed': 'Double bed accommodation',
  'Double Bed + Ensuite': 'Double bed with attached toilet',
  'Double Bed + Ensuite + Priv Study': 'Double bed with ensuite and private study room',
};

// Maps room_types.name → accommodation_requests JSONB shorthand keys
export const ROOM_NAME_TO_SHORTHAND: Record<string, string> = {
  'Single Bed': 'singleBB',
  'Double Bed': 'doubleBB',
  'Double Bed + Ensuite': 'doubleEnsuite',
  'Double Bed + Ensuite + Priv Study': 'studySuite',
};
