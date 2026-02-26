import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';

export default function ClimbingCube() {
    const cubeRef = useRef();

    useFrame((state, delta) => {
        if (cubeRef.current) {
            cubeRef.current.position.y += delta * 2;
            cubeRef.current.rotation.x += delta * 0.5;
            cubeRef.current.rotation.y += delta * 0.8;

            // Loop the position to give "infinite" climbing effect
            if (cubeRef.current.position.y > 10) {
                cubeRef.current.position.y = -10;
            }
        }
    });

    return (
        <group>
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={2} color="#ffffff" />

            {/* Background Grid */}
            <gridHelper args={[50, 50, "#333333", "#111111"]} position={[0, -5, -10]} rotation={[Math.PI / 2, 0, 0]} />

            <mesh ref={cubeRef} position={[0, -10, -5]}>
                <boxGeometry args={[2, 2, 2]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    metalness={0.9}
                    roughness={0.1}
                    clearcoat={1}
                    clearcoatRoughness={0.1}
                />
            </mesh>

            <Environment preset="city" />
        </group>
    );
}
