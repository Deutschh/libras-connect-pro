import { useRef, useState, useCallback, useEffect } from "react";
import { useMediaPipe } from "./hooks/useMediaPipe";
import { recognizeGesture } from "./utils/geometry";

function App() {
  const videoRef = useRef(null);
  // CORREÇÃO 1: Declarar a referência do Canvas
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState("Aguardando...");

  const onResults = useCallback((results) => {
    // CORREÇÃO 2: Verificar se o canvasRef existe antes de usar
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext("2d");

    canvasCtx.save();
    // Limpa e desenha o frame atual
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

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      // Identifica o gesto primeiro
      const detectedGesture = recognizeGesture(landmarks);

      // Atualiza o estado uma única vez com o resultado final
      setGesture(detectedGesture);

      // Desenha os conectores para todas as mãos detectadas
      for (const hand of results.multiHandLandmarks) {
        window.drawConnectors(canvasCtx, hand, window.HAND_CONNECTIONS, {
          color: "#00FFFF",
          lineWidth: 5,
        });
        window.drawLandmarks(canvasCtx, hand, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }
    } else {
      setGesture("Nenhuma mão visível");
    }
    canvasCtx.restore();
  }, []);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((d) => d.kind === "videoinput");
      console.log("Câmeras encontradas:", videoDevices);
    });
  }, []);

  useMediaPipe(videoRef, onResults);

  return (
    <div className="bg-slate-900 h-screen w-full flex flex-col items-center justify-center text-white p-4">
      <h1 className="text-3xl font-bold mb-4 text-cyan-400">
        Libras-Connect Vision Core
      </h1>

      <div className="relative rounded-lg overflow-hidden border-4 border-cyan-500 shadow-xl shadow-cyan-500/20">
        <video
          ref={videoRef}
          className="w-full max-w-2xl"
          autoPlay
          muted
          playsInline
        />
        {/* CORREÇÃO 3: Adicionar o elemento Canvas sobre o vídeo */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 w-full h-full"
          width={640} // Deve ser o mesmo da configuração da câmera
          height={480}
        />
      </div>

      <div className="mt-8 p-6 bg-slate-800 rounded-xl w-full max-w-md text-center">
        <p className="text-slate-400 uppercase text-sm mb-2">
          Status do Sistema
        </p>
        <p className="text-4xl font-black text-white">{gesture}</p>
      </div>
    </div>
  );
}

export default App;
