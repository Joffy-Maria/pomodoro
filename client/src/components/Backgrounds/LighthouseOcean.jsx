import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Sparkles } from '@react-three/drei';

export default function LighthouseOcean() {
    const beamRef = useRef();
    const oceanRef = useRef();

    useFrame((state, delta) => {
        if (beamRef.current) {
            beamRef.current.rotation.y += delta * 0.5; // Sweeping beam
        }
        if (oceanRef.current) {
            // simple wave animation via shifting texture/position or rotation
            oceanRef.current.position.z = Math.sin(state.clock.elapsedTime) * 0.5 - 5;
        }
    });

    return (
        <group>
            <ambientLight intensity={0.05} />

            {/* Ocean plane */}
            <mesh ref={oceanRef} position={[0, -2, -5]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[50, 50, 32, 32]} />
                <meshStandardMaterial color="#020617" wireframe transparent opacity={0.3} />
            </mesh>

            {/* Lighthouse Tower */}
            <mesh position={[0, 2, -15]}>
                <cylinderGeometry args={[1, 1.5, 8, 16]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Light Source */}
            <mesh position={[0, 6, -15]}>
                <sphereGeometry args={[0.8, 16, 16]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={3} />
            </mesh>

            {/* Sweeping Beam */}
            <group position={[0, 6, -15]} ref={beamRef}>
                <mesh position={[10, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                    <coneGeometry args={[4, 20, 32, 1, true]} />
                    <meshBasicMaterial color="#fef08a" transparent opacity={0.15} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
                </mesh>
            </group>

            {/* Mist particles */}
            <Sparkles position={[0, 0, -5]} count={300} scale={20} size={4} speed={0.1} opacity={0.2} color="#94a3b8" />
        </group>
    );
}
