import { useRef, useState, useCallback, useEffect } from "react";
import { useMediaPipe } from "./hooks/useMediaPipe";
import { recognizeGesture } from "./utils/geometry";
import { speak } from "./services/speech";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [leftGesture, setLeftGesture] = useState("Nenhuma");
  const [rightGesture, setRightGesture] = useState("Nenhuma");
  const [history, setHistory] = useState([]);

  const movementBuffer = useRef({ Left: [], Right: [] });
  const lastSpoken = useRef({ Left: "", Right: "" });
  const speechCooldown = useRef(false);

  const onResults = useCallback((results) => {
    if (!canvasRef.current) return;
    const canvasCtx = canvasRef.current.getContext("2d");

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
        const handedness = results.multiHandedness[index].label;

        const history = movementBuffer.current[handedness];
        history.push(landmarks[0]);
        if (history.length > 15) history.shift();

        const gesture = recognizeGesture(landmarks, history);

        if (gesture !== "Nenhuma" && gesture !== "Mão Detectada") {
          const isNewGesture = gesture !== lastSpoken.current[handedness];

          if (isNewGesture && !speechCooldown.current) {
            speak(gesture);
            lastSpoken.current[handedness] = gesture;

            setHistory((prev) =>
              [
                {
                  id: Date.now(),
                  text: gesture,
                  hand: handedness === "Left" ? "Esq" : "Dir",
                  time: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
                ...prev,
              ].slice(0, 5),
            ); // Mantém os últimos 5 para o novo layout

            speechCooldown.current = true;
            setTimeout(() => {
              speechCooldown.current = false;
            }, 1500);
          }
        }

        if (handedness === "Left") currentLeft = gesture;
        if (handedness === "Right") currentRight = gesture;

        // Desenho dos landmarks com roxo médio
        window.drawConnectors(canvasCtx, landmarks, window.HAND_CONNECTIONS, {
          color: "#7E22CE",
          lineWidth: 4,
        }); // Purple-700
        window.drawLandmarks(canvasCtx, landmarks, {
          color: "#f9fafb",
          lineWidth: 1,
          radius: 3,
        }); // Red-500
      });
    } else {
      movementBuffer.current = { Left: [], Right: [] };
      lastSpoken.current = { Left: "", Right: "" };
    }

    setLeftGesture(currentLeft);
    setRightGesture(currentRight);
    canvasCtx.restore();
  }, []);

  useMediaPipe(videoRef, onResults);

  return (
    <div className="bg-slate-50 h-screen w-full flex flex-col items-center p-4 font-sans text-slate-900">
      <header className="mb-6 text-center w-full max-w-7xl">
        <h1 className="text-3xl font-black text-purple-700 tracking-tighter uppercase italic">
          Vision <span className="text-slate-900 font-bold">Core</span>
        </h1>
        <p className="text-slate-600 text-xs font-mono tracking-widest">
          Connect Pro • Bimanual PoC
        </p>
      </header>

      {/* Grid Principal: Câmera à Esquerda, Status e Log à Direita */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl flex-grow overflow-hidden">
        {/* CORREÇÃO DE ALTURA: Viewport de Vídeo com min-h- */}
        <div className="md:col-span-2 relative rounded-3xl overflow-hidden border-2 border-slate-200 shadow-lg min-h-[450px] bg-slate-100">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
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
          <div className="absolute top-4 left-4 bg-white/70 px-3 py-1 rounded-full text-xs font-bold text-purple-800 backdrop-blur-sm">
            Live
          </div>
        </div>

        {/* Coluna de Status e Log */}
        <aside className="flex flex-col gap-6 overflow-hidden">
          {/* Dashboard de Tradução Bimanual */}
          <div className="flex gap-4">
            <div className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all">
              <p className="text-purple-600 font-bold tracking-widest text-[10px] mb-1">
                ESQUERDA
              </p>
              <h2 className="text-3xl font-black text-slate-950">
                {leftGesture === "Nenhuma" ? "---" : leftGesture}
              </h2>
            </div>
            <div className="flex-1 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all">
              <p className="text-purple-600 font-bold tracking-widest text-[10px] mb-1">
                DIREITA
              </p>
              <h2 className="text-3xl font-black text-slate-950">
                {rightGesture === "Nenhuma" ? "---" : rightGesture}
              </h2>
            </div>
          </div>

          {/* Log de Tradução (Histórico) */}
          <div className="flex-grow bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-purple-600 font-bold tracking-widest text-xs uppercase">
                Histórico de Conversa
              </h3>
              <button
                onClick={() => setHistory([])}
                className="text-slate-400 hover:text-red-500 text-xs transition-colors"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-2 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
              {history.length === 0 ? (
                <p className="text-slate-400 text-sm italic text-center py-4">
                  Nenhuma tradução recente...
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100/50"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.hand === "Esq" ? "bg-purple-100 text-purple-700" : "bg-purple-100 text-purple-700"}`}
                      >
                        {item.hand}
                      </span>
                      <span className="text-slate-950 font-medium">
                        {item.text}
                      </span>
                    </span>
                    <span className="text-slate-400 text-[10px] font-mono">
                      {item.time}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer className="mt-8 text-slate-400 text-xs uppercase tracking-widest border-t border-slate-100 w-full max-w-7xl pt-4 text-center">
        Identidade Vocal Ativa • PoC System Connect Pro
      </footer>
    </div>
  );
}

export default App;
