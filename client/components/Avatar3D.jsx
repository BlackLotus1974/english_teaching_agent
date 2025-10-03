import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Avatar3D({ audioElement }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4ff);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);
    camera.lookAt(0, 1.6, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    containerRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Load avatar
    const loader = new GLTFLoader();
    loader.load(
      "/avatar.glb",
      (gltf) => {
        const avatar = gltf.scene;
        avatar.position.set(0, 0, 0);
        avatar.scale.set(1, 1, 1);

        // Enable shadows
        avatar.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
          }
        });

        scene.add(avatar);
        avatarRef.current = avatar;
        console.log("Avatar loaded successfully");
      },
      (progress) => {
        console.log(`Loading avatar: ${(progress.loaded / progress.total) * 100}%`);
      },
      (error) => {
        console.error("Error loading avatar:", error);
      }
    );

    // Animation loop
    let idleTime = 0;
    function animate() {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Idle animation (gentle head movement)
      if (avatarRef.current) {
        idleTime += 0.01;
        avatarRef.current.rotation.y = Math.sin(idleTime) * 0.05;
        avatarRef.current.position.y = Math.sin(idleTime * 2) * 0.02;
      }

      // Audio-based animation
      if (analyzerRef.current && avatarRef.current) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = average / 255;

        // Find mouth/head bone and animate (if available)
        avatarRef.current.traverse((node) => {
          if (node.isBone) {
            if (node.name.toLowerCase().includes('jaw') ||
                node.name.toLowerCase().includes('mouth')) {
              // Animate jaw based on audio
              node.rotation.x = -normalized * 0.3;
            }
          }

          // Scale-based mouth animation if no bones found
          if (node.isMesh && node.name.toLowerCase().includes('head')) {
            const targetScale = 1 + normalized * 0.05;
            node.scale.y = THREE.MathUtils.lerp(node.scale.y, targetScale, 0.1);
          }
        });
      }

      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    function handleResize() {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Set up audio analysis when audio element changes
  useEffect(() => {
    if (!audioElement || !audioElement.srcObject) return;

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(audioElement.srcObject);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      analyzerRef.current = analyzer;
      console.log("Audio analyzer connected");
    } catch (error) {
      console.error("Error setting up audio analysis:", error);
    }
  }, [audioElement?.srcObject]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    />
  );
}
