export function getLocalDayToken(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDailyIndex(date: Date, totalItems: number) {
  if (totalItems <= 0) {
    return 0;
  }

  const localMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );
  const daySerial = Math.floor(localMidnight.getTime() / 86_400_000);
  const normalized = ((daySerial % totalItems) + totalItems) % totalItems;
  return normalized;
}
