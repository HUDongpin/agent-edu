export function formatAgentOrchestrationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  if (!minutes) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

export function formatAgentOrchestrationModuleNumber(order: number): string {
  return String(order).padStart(2, "0");
}
