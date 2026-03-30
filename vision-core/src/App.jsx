import { useRef, useState, useCallback, useEffect } from "react";
import { useMediaPipe } from "./hooks/useMediaPipe";
import { recognizeGesture } from "./utils/geometry";
import { speak } from "./services/speech"; // Certifique-se de criar este arquivo

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [history, setHistory] = useState([]);

  // Estados para exibição na UI
  const [leftGesture, setLeftGesture] = useState("Nenhuma");
  const [rightGesture, setRightGesture] = useState("Nenhuma");

  // Refs para controle de movimento e voz (não causam re-render)
  const movementBuffer = useRef({ Left: [], Right: [] });
  const lastSpoken = useRef({ Left: "", Right: "" });
  const speechCooldown = useRef(false);

  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");

    // Desenho do frame no Canvas [cite: 73]
    canvasCtx.save();
    canvasCtx.clearRect(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );

    let currentLeft = "Nenhuma";
    let currentRight = "Nenhuma";

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      results.multiHandLandmarks.forEach((landmarks, index) => {
        const handedness = results.multiHandedness[index].label; // "Left" ou "Right"

        // 1. Atualiza buffer de movimento para sinais dinâmicos (como o "Oi")
        const history = movementBuffer.current[handedness];
        history.push(landmarks[0]); // Salva posição do pulso
        if (history.length > 15) history.shift();

        // 2. Reconhecimento do gesto [cite: 89, 92]
        const gesture = recognizeGesture(landmarks, history);

        // 3. Lógica de Voz (Filtro de Ruído/Cooldown) [cite: 94, 96]
        if (gesture !== "Nenhuma" && gesture !== "Mão Detectada") {
          const isNewGesture = gesture !== lastSpoken.current[handedness];

          if (isNewGesture && !speechCooldown.current) {
            speak(gesture); // Chama a Web Speech API
            lastSpoken.current[handedness] = gesture;

            // Trava novas falas por 1.5s para evitar repetições
            speechCooldown.current = true;
            setTimeout(() => {
              speechCooldown.current = false;
            }, 1500);
          }
        }

        // 4. Mapeamento para a UI
        if (handedness === "Left") currentLeft = gesture;
        if (handedness === "Right") currentRight = gesture;

        // 5. Desenho dos Landmarks [cite: 73]
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: "#00FFFF",
          lineWidth: 5,
        });
        window.drawLandmarks(canvasCtx, landmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      });
    } else {
      // Limpa buffers se as mãos sumirem
      movementBuffer.current = { Left: [], Right: [] };
      lastSpoken.current = { Left: "", Right: "" };
    }

    setLeftGesture(currentLeft);
    setRightGesture(currentRight);
    canvasCtx.restore();
  }, []);

  useMediaPipe(videoRef, onResults);

  return (
    <div className="bg-slate-900 h-screen w-full flex flex-col items-center justify-center text-white p-4 font-sans">
      <header className="mb-8 text-center">
        <h1 className="text-5xl font-black text-cyan-400 tracking-tighter uppercase italic">
          Vision <span className="text-white">Core</span>
        </h1>
        <p className="text-slate-400 text-sm font-mono tracking-widest">
          Libras-Connect Pro • PoC System [cite: 1, 63]
        </p>
      </header>

      {/* Viewport de Vídeo/IA */}
      <div className="relative rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl">
        <video
          ref={videoRef}
          className="w-full max-w-2xl"
          autoPlay
          muted
          playsInline
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width={640}
          height={480}
        />
      </div>

      {/* Dashboard de Tradução Bimanual [cite: 6, 95] */}
      <div className="mt-10 flex gap-6 w-full max-w-2xl">
        <div className="flex-1 p-8 bg-slate-800 rounded-3xl border-b-8 border-cyan-600 transition-all">
          <p className="text-cyan-500 font-bold tracking-widest text-xs mb-2">
            ESQUERDA
          </p>
          <h2 className="text-5xl font-black text-white">
            {leftGesture === "Nenhuma" ? "---" : leftGesture}
          </h2>
        </div>

        <div className="flex-1 p-8 bg-slate-800 rounded-3xl border-b-8 border-cyan-600 transition-all">
          <p className="text-cyan-500 font-bold tracking-widest text-xs mb-2">
            DIREITA
          </p>
          <h2 className="text-5xl font-black text-white">
            {rightGesture === "Nenhuma" ? "---" : rightGesture}
          </h2>
        </div>
      </div>

      <footer className="mt-8 text-slate-500 text-xs uppercase tracking-widest">
        Identidade Vocal Ativa • Sincronização em Tempo Real [cite: 16, 20]
      </footer>
    </div>
  );
}

export default App;
