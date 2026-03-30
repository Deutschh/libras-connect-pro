export const speak = (text) => {
  // Cancela falas anteriores para não encavalar
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = 1.0; // Velocidade da fala
  utterance.pitch = 1.0; // Tom da voz

  window.speechSynthesis.speak(utterance);
};