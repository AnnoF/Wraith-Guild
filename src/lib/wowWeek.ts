// La semaine WoW commence le mercredi (reset hebdomadaire) et se termine
// le mardi suivant. Utilisé pour le verrou "un personnage ne peut pas
// faire le même raid deux fois dans la semaine".
export function getWowWeekRange(date: Date | string): { start: Date; end: Date } {
  const d = new Date(date);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = midnight.getDay(); // 0=dimanche ... 3=mercredi ... 6=samedi
  const daysSinceWednesday = (day - 3 + 7) % 7;
  const start = new Date(midnight);
  start.setDate(midnight.getDate() - daysSinceWednesday);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}
