// Deterministic faction color palette
const FACTION_COLORS = [
  '#e74c3c', '#e67e22', '#9b59b6', '#1abc9c', '#e84393',
  '#00b894', '#fdcb6e', '#6c5ce7', '#00cec9', '#d63031',
  '#a29bfe', '#fab1a0', '#74b9ff', '#55efc4', '#fd79a8',
];

export function getFactionColor(factionId: string): string {
  let hash = 0;
  for (let i = 0; i < factionId.length; i++) {
    hash = ((hash << 5) - hash + factionId.charCodeAt(i)) | 0;
  }
  return FACTION_COLORS[Math.abs(hash) % FACTION_COLORS.length];
}
