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
    // Aumentamos a verificação para 10 frames de histórico para ter mais dados
    if (movementHistory.length > 10) {
      const xPositions = movementHistory.map((p) => p.x);
      const minX = Math.min(...xPositions);
      const maxX = Math.max(...xPositions);

      // Threshold de 0.04 rastreando a PONTA do dedo (ponto 20) é perfeito
      if (maxX - minX > 0.04) {
        return "Oi!";
      }
    }
    return "Letra I";
  }

  return "Mão Detectada";
};

export const checkBimanualGesture = (leftLandmarks, rightLandmarks) => {
  if (!leftLandmarks || !rightLandmarks) return null;

  // Calculamos a distância entre as pontas dos dedos indicadores (ponto 8)
  const tipsDistance = getDistance(leftLandmarks[8], rightLandmarks[8]);

  // Lógica para CASA:
  // 1. As pontas dos dedos devem estar próximas (distância < 0.1)
  // 2. Ambas as mãos devem estar abertas (formato da Letra B)
  const leftFingers = getFingerStates(leftLandmarks);
  const rightFingers = getFingerStates(rightLandmarks);

  const bothOpen =
    leftFingers.indicador &&
    rightFingers.indicador &&
    leftFingers.medio &&
    rightFingers.medio;

  if (tipsDistance < 0.1 && bothOpen) {
    return "Casa";
  }

  return null;
};
