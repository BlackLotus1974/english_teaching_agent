import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export default function Avatar3D({ audioElement }) {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const avatarRef = useRef(null);
  const analyzerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const morphTargetMeshesRef = useRef([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f4ff);
    sceneRef.current = scene;

    // Camera setup - closer view focused on face
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.65, 0.8);  // Closer to face
    camera.lookAt(0, 1.65, 0);  // Look at head height

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

        // Enable shadows and find meshes with morph targets
        avatar.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;

            // Check for morph targets (blend shapes) for lip sync
            if (node.morphTargetDictionary && node.morphTargetInfluences) {
              morphTargetMeshesRef.current.push(node);
              console.log(`Found mesh with morph targets: ${node.name}`, Object.keys(node.morphTargetDictionary));
            }
          }
        });

        scene.add(avatar);
        avatarRef.current = avatar;
        console.log("Avatar loaded successfully");
        console.log(`Found ${morphTargetMeshesRef.current.length} meshes with morph targets for lip sync`);
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

      // Audio-based lip sync animation using morph targets
      if (analyzerRef.current && morphTargetMeshesRef.current.length > 0) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        const normalized = Math.min(average / 128, 1); // Normalize to 0-1, more sensitive

        // Animate morph targets for lip sync
        morphTargetMeshesRef.current.forEach((mesh) => {
          const dict = mesh.morphTargetDictionary;
          const influences = mesh.morphTargetInfluences;

          // Try multiple possible morph target naming conventions
          const mouthTargets = [
            'mouthOpen', 'jawOpen', 'mouthSmile',
            'viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U',
            'viseme_PP', 'viseme_FF', 'viseme_TH', 'viseme_DD', 'viseme_kk',
            'viseme_CH', 'viseme_SS', 'viseme_nn', 'viseme_RR', 'viseme_sil',
            'jawForward', 'mouthClose', 'mouthFunnel', 'mouthPucker',
            'mouthLeft', 'mouthRight', 'mouthShrugLower', 'mouthShrugUpper'
          ];

          mouthTargets.forEach((targetName) => {
            if (dict[targetName] !== undefined) {
              const index = dict[targetName];
              // Smooth interpolation for natural movement
              // Use higher intensity for better visibility
              const targetValue = normalized * 1.2;
              influences[index] = THREE.MathUtils.lerp(
                influences[index] || 0,
                targetValue,
                0.4 // Faster response
              );
            }
          });
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
    if (!audioElement || !audioElement.srcObject) {
      console.log("Audio element not ready:", { audioElement, srcObject: audioElement?.srcObject });
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(audioElement.srcObject);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      analyzer.smoothingTimeConstant = 0.8;
      source.connect(analyzer);

      analyzerRef.current = analyzer;
      console.log("Audio analyzer connected successfully!");
      console.log("Frequency bin count:", analyzer.frequencyBinCount);

      // Test if we're getting audio data
      const testData = new Uint8Array(analyzer.frequencyBinCount);
      const checkAudio = setInterval(() => {
        analyzer.getByteFrequencyData(testData);
        const avg = testData.reduce((a, b) => a + b) / testData.length;
        if (avg > 0) {
          console.log("Audio detected! Average level:", avg);
          clearInterval(checkAudio);
        }
      }, 500);

      // Clear interval after 10 seconds
      setTimeout(() => clearInterval(checkAudio), 10000);

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
