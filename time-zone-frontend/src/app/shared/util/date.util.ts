export function toDate(value: string): Date {
  // Les Instant Java peuvent avoir jusqu'à 9 décimales : on tronque à la milliseconde,
  // seule précision garantie par Date.parse sur tous les navigateurs.
  return new Date(value.replace(/(\.\d{3})\d+/, '$1'));
}

export function transformToUTCDate(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds(),
      0,
    ),
  );
}
