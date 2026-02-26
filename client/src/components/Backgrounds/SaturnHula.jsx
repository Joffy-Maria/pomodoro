import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';

export default function SaturnHula() {
    const saturnRef = useRef();
    const ringRef = useRef();

    useFrame((state, delta) => {
        if (saturnRef.current && ringRef.current) {
            saturnRef.current.rotation.y += delta * 0.1;
            // Hula hoop wobble effect
            ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 2) * 0.3 + Math.PI / 2;
            ringRef.current.rotation.y = Math.cos(state.clock.elapsedTime * 2) * 0.3;
        }
    });

    return (
        <group>
            <ambientLight intensity={0.1} />
            <directionalLight position={[5, 3, 5]} intensity={3} color="#fef08a" />

            <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />

            <group position={[0, 0, -10]}>
                {/* Planet */}
                <mesh ref={saturnRef}>
                    <sphereGeometry args={[3, 64, 64]} />
                    <meshStandardMaterial color="#fcd34d" roughness={0.7} metalness={0.2} />
                </mesh>

                {/* Ring */}
                <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[5, 0.4, 16, 100]} />
                    <meshStandardMaterial color="#f9a8d4" emissive="#be185d" emissiveIntensity={0.5} wireframe />
                </mesh>
            </group>
        </group>
    );
}
