// Calcula a distância entre dois pontos (X, Y, Z)
export const getDistance = (p1, p2) => {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2),
  );
};

// Verifica o estado dos dedos
export const getFingerStates = (landmarks) => {
  const palmBase = landmarks[0]; // Ponto de referência na palma

  // Pontas dos dedos: 8(Ind), 12(Méd), 16(Anu), 20(Mín)
  // Bases dos dedos: 5(Ind), 9(Méd), 13(Anu), 17(Mín)

  // Consideramos o dedo esticado se a ponta estiver mais longe da palma que a base
  return {
    indicador:
      getDistance(landmarks[8], palmBase) > getDistance(landmarks[5], palmBase),
    medio:
      getDistance(landmarks[12], palmBase) >
      getDistance(landmarks[9], palmBase),
    anelar:
      getDistance(landmarks[16], palmBase) >
      getDistance(landmarks[13], palmBase),
    minimo:
      getDistance(landmarks[20], palmBase) >
      getDistance(landmarks[17], palmBase),
    polegar:
      getDistance(landmarks[4], landmarks[17]) >
      getDistance(landmarks[2], landmarks[17]),
  };
};

export const recognizeGesture = (landmarks, movementHistory = []) => {
  const fingers = getFingerStates(landmarks);

  // --- ALFABETO ESTÁTICO ---

  // 1. Letra A (Já temos)
  if (
    !fingers.indicador &&
    !fingers.medio &&
    !fingers.anelar &&
    !fingers.minimo
  )
    return "Letra A";

  // 2. Letra B (Já temos)
  if (
    fingers.indicador &&
    fingers.medio &&
    fingers.anelar &&
    fingers.minimo &&
    !fingers.polegar
  )
    return "Letra B";

  // 3. Letra L
  if (
    fingers.indicador &&
    fingers.polegar &&
    !fingers.medio &&
    !fingers.anelar &&
    !fingers.minimo
  )
    return "Letra L";

  // 4. Letra V
  if (fingers.indicador && fingers.medio && !fingers.anelar && !fingers.minimo)
    return "Letra V";

  // 5. Letra W
  if (fingers.indicador && fingers.medio && fingers.anelar && !fingers.minimo)
    return "Letra W";

  // 6. Letra D (Lógica de anel: indicador em pé, outros juntos)
  if (fingers.indicador && !fingers.medio && !fingers.anelar && !fingers.minimo)
    return "Letra D";

  // --- GESTOS DINÂMICOS ---

  // 7. Letra I / Sinal "Oi" (Já temos)
  const isLetterI =
    !fingers.indicador && !fingers.medio && !fingers.anelar && fingers.minimo;
  if (isLetterI) {
    if (movementHistory.length > 5) {
      const xPositions = movementHistory.map((p) => p.x);
      if (Math.max(...xPositions) - Math.min(...xPositions) > 0.1) return "Oi!";
    }
    return "Letra I";
  }

  return "Mão Detectada";
};
