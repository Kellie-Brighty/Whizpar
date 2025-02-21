const adjectives = ["Hidden", "Silent", "Secret", "Shadow", "Mystery", "Unknown"];
const nouns = ["Whisper", "Echo", "Voice", "Spirit", "Ghost", "Phantom"];

export const generateRandomUsername = () => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
}; 