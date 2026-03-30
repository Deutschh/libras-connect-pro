// hooks/useMediaPipe.js
import { useEffect, useRef } from "react";

export const useMediaPipe = (videoRef, onResults) => {
  const cameraRef = useRef(null);

  useEffect(() => {
    const Hands = window.Hands;
    const Camera = window.Camera;
    if (!Hands || !Camera) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);

    const initCamera = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((d) => d.kind === "videoinput");

      // Tenta achar o Iriun, senão pega a última da lista (geralmente a externa)
      const selectedDevice =
        videoDevices.find((d) => d.label.toLowerCase().includes("iriun")) ||
        videoDevices[videoDevices.length - 1];

      if (videoRef.current && selectedDevice) {
        cameraRef.current = new Camera(videoRef.current, {
          onFrame: async () => {
            await hands.send({ image: videoRef.current });
          },
          width: 640,
          height: 480,
          deviceId: selectedDevice.deviceId,
        });
        cameraRef.current.start();
      }
    };

    initCamera();

    return () => {
      if (cameraRef.current) cameraRef.current.stop();
      hands.close();
    };
  }, [videoRef, onResults]);

  return null;
};
