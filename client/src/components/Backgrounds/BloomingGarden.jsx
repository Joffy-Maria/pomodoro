import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

const BioluminescentFlower = ({ position, color, scale }) => {
    const group = useRef();

    useFrame((state) => {
        if (group.current) {
            group.current.rotation.y += 0.01;
            group.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2;
        }
    });

    return (
        <group ref={group} position={position} scale={scale}>
            {/* Stem */}
            <mesh position={[0, -2, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 4, 8]} />
                <meshStandardMaterial color="#065f46" />
            </mesh>
            {/* Petals */}
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <mesh>
                    <torusKnotGeometry args={[0.5, 0.15, 64, 8, 2, 3]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} wireframe />
                </mesh>
            </Float>
        </group>
    );
};

export default function BloomingGarden() {
    return (
        <group>
            <ambientLight intensity={0.2} />
            <pointLight position={[0, 5, 0]} intensity={2} color="#818cf8" />

            <BioluminescentFlower position={[-4, -2, -5]} color="#f472b6" scale={1} />
            <BioluminescentFlower position={[4, -1, -8]} color="#34d399" scale={1.5} />
            <BioluminescentFlower position={[0, -3, -4]} color="#a78bfa" scale={0.8} />
            <BioluminescentFlower position={[-6, 0, -10]} color="#fbbf24" scale={2} />
            <BioluminescentFlower position={[6, -2, -6]} color="#2dd4bf" scale={1.2} />

            <Sparkles count={200} scale={15} size={2} speed={0.4} opacity={0.5} color="#c084fc" noise={1} />
        </group>
    );
}
