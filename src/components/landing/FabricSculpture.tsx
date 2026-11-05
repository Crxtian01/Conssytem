'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Real-time WebGL 3D Isometric Architectural Sculpture of the ConstructMS Logo.
 *
 * Renders the complete 3D ConstructMS structure in true 3D space:
 *  - Matte charcoal-black & brushed brass interlocking structural portal frames
 *  - Beveled 3D brushed-brass T-square ruler threading through the frames with
 *    procedural millimeter/centimeter graduation tick marks
 *  - 7 floating 3D spheres (glossy amber, matte charcoal ink, pearl ivory)
 *    with independent 3D bobbing and accurate depth occlusion
 *  - Accurate 3D rotation when moving the mouse OR clicking & dragging the sculpture
 */

const VERTEX_SHADER = `
attribute vec3 aPos;
attribute vec3 aNormal;
attribute vec2 aUv;
attribute float aMat;
attribute float aPart;

uniform mat4 uProj;
uniform mat4 uView;
uniform mat4 uModel;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vMat;
varying float vPart;

void main() {
  vec3 p = aPos;

  // Independent 3D floating motion for the 7 spheres (aPart >= 10.0)
  if (aPart >= 10.0) {
    float idx = aPart - 10.0;
    float bob = sin(uTime * 1.45 + idx * 1.35) * 0.055;
    float swayX = cos(uTime * 0.95 + idx * 2.1) * 0.025;
    float swayZ = sin(uTime * 1.15 + idx * 1.7) * 0.025;
    p += vec3(swayX, bob, swayZ);
  } else if (aPart >= 1.0 && aPart < 5.0) {
    // Subtle breathing motion of the T-square & inner brass frame
    float breathe = sin(uTime * 1.1 + aPart) * 0.012;
    p.y += breathe;
  }

  vec4 world = uModel * vec4(p, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
  vUv = aUv;
  vMat = aMat;
  vPart = aPart;

  gl_Position = uProj * uView * world;
}
`

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec3 vNormal;
varying vec3 vWorldPos;
varying vec2 vUv;
varying float vMat;
varying float vPart;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(vec3(0.0, 0.2, 6.5) - vWorldPos);

  // Studio three-point lighting setup matching the ConstructMS brand render
  vec3 keyLight  = normalize(vec3(-0.55, 0.82, 0.58));
  vec3 fillLight = normalize(vec3(0.75, 0.25, 0.45));
  vec3 rimLight  = normalize(vec3(0.15, -0.75, -0.65));

  float ndlKey  = max(dot(N, keyLight), 0.0);
  float ndlFill = max(dot(N, fillLight), 0.0);
  float ndlRim  = max(dot(N, rimLight), 0.0);

  vec3 HKey  = normalize(keyLight + V);
  vec3 HFill = normalize(fillLight + V);
  float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);

  vec3 col = vec3(0.2);

  // Material 0: Matte Architectural Charcoal-Black (#222428)
  if (vMat < 0.5) {
    vec3 base = vec3(0.145, 0.152, 0.168);
    float diff = 0.32 + ndlKey * 0.62 + ndlFill * 0.22 + ndlRim * 0.14;
    float spec = pow(max(dot(N, HKey), 0.0), 28.0) * 0.22;
    // Subtle edge highlight on bevels
    float edge = smoothstep(0.0, 0.04, vUv.x) * smoothstep(1.0, 0.96, vUv.x)
               * smoothstep(0.0, 0.04, vUv.y) * smoothstep(1.0, 0.96, vUv.y);
    col = base * diff + vec3(0.85, 0.78, 0.68) * spec + vec3(0.04) * (1.0 - edge) + fresnel * 0.06;
  }
  // Material 1: Brushed Architectural Brass / Gold (#c59e5e)
  else if (vMat < 1.5) {
    float grain = sin(vUv.x * 180.0 + vUv.y * 40.0) * 0.018;
    vec3 goldLight = vec3(0.86, 0.72, 0.46) + grain;
    vec3 goldDeep  = vec3(0.54, 0.40, 0.20);
    float diff = clamp(ndlKey * 0.78 + ndlFill * 0.32 + 0.18, 0.0, 1.0);
    vec3 base = mix(goldDeep, goldLight, diff);
    float spec = pow(max(dot(N, HKey), 0.0), 42.0) * 0.55
               + pow(max(dot(N, HFill), 0.0), 24.0) * 0.20;
    col = base + vec3(1.0, 0.94, 0.78) * spec + vec3(0.95, 0.80, 0.50) * fresnel * 0.15;
  }
  // Material 2: Graduated Brushed-Brass T-Square Ruler Blade (with tick marks)
  else if (vMat < 2.5) {
    float grain = sin(vUv.x * 260.0) * 0.015;
    vec3 brassLight = vec3(0.84, 0.68, 0.42) + grain;
    vec3 brassDeep  = vec3(0.50, 0.36, 0.18);
    float diff = clamp(ndlKey * 0.80 + ndlFill * 0.30 + 0.20, 0.0, 1.0);
    vec3 base = mix(brassDeep, brassLight, diff);

    // Procedural ruler graduation ticks along the top face of the blade (N.y > 0.3 or front-facing)
    if (N.y > 0.25 && vUv.x > 0.06 && vUv.x < 0.96) {
      float scaleCoord = vUv.x * 68.0;
      float frac = fract(scaleCoord);
      float tickLine = 1.0 - smoothstep(0.0, 0.13, min(frac, 1.0 - frac));

      // Major (every 5 units), medium (every 2.5), minor (every 1)
      float idx = floor(scaleCoord + 0.5);
      bool isMajor = mod(idx, 5.0) < 0.5;
      float edgeDist = min(vUv.y, 1.0 - vUv.y);
      float maxLen = isMajor ? 0.28 : 0.16;
      float inTick = step(edgeDist, maxLen) * tickLine;

      vec3 tickColor = vec3(0.24, 0.16, 0.07);
      base = mix(base, tickColor, inTick * 0.78);
    }

    float spec = pow(max(dot(N, HKey), 0.0), 48.0) * 0.58;
    col = base + vec3(1.0, 0.95, 0.80) * spec;
  }
  // Material 3: Glossy Amber / Gold Sphere (#eb9619)
  else if (vMat < 3.5) {
    vec3 amberTop = vec3(0.99, 0.72, 0.18);
    vec3 amberMid = vec3(0.90, 0.48, 0.05);
    vec3 amberBot = vec3(0.46, 0.20, 0.02);
    float wrap = clamp((dot(N, keyLight) + 0.35) / 1.35, 0.0, 1.0);
    vec3 base = mix(amberBot, mix(amberMid, amberTop, wrap), wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 64.0) * 0.78;
    col = base + vec3(1.0, 0.97, 0.88) * spec + vec3(1.0, 0.78, 0.35) * fresnel * 0.22;
  }
  // Material 4: Matte Charcoal Sphere (#1d1f22)
  else if (vMat < 4.5) {
    vec3 darkTop = vec3(0.27, 0.28, 0.31);
    vec3 darkBot = vec3(0.07, 0.075, 0.085);
    float wrap = clamp((dot(N, keyLight) + 0.30) / 1.30, 0.0, 1.0);
    vec3 base = mix(darkBot, darkTop, wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 36.0) * 0.32;
    col = base + vec3(0.95, 0.95, 1.0) * spec + vec3(0.35) * fresnel * 0.14;
  }
  // Material 5: Warm Pearl / Ivory Sphere (#f4ede1)
  else {
    vec3 pearlTop = vec3(0.99, 0.97, 0.93);
    vec3 pearlBot = vec3(0.74, 0.68, 0.59);
    float wrap = clamp((dot(N, keyLight) + 0.40) / 1.40, 0.0, 1.0);
    vec3 base = mix(pearlBot, pearlTop, wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 52.0) * 0.48;
    col = base + vec3(1.0) * spec + vec3(1.0, 0.96, 0.88) * fresnel * 0.18;
  }

  gl_FragColor = vec4(col, 1.0);
}
`

type Mat4 = Float32Array

function perspective(fovy: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovy / 2)
  const nf = 1 / (near - far)
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ])
}

function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k]
      out[c * 4 + r] = sum
    }
  }
  return out
}

function rotateX(t: number): Mat4 {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return new Float32Array([1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1])
}

function rotateY(t: number): Mat4 {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1])
}

function rotateZ(t: number): Mat4 {
  const c = Math.cos(t)
  const s = Math.sin(t)
  return new Float32Array([c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1])
}

function translate(x: number, y: number, z: number): Mat4 {
  return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1])
}

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[FabricSculpture] shader error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

interface MeshBuilder {
  positions: number[]
  normals: number[]
  uvs: number[]
  mats: number[]
  parts: number[]
  indices: number[]
}

/**
 * Adds an oriented 3D box with independent per-face materials (so beams can have
 * brushed-gold top/inner faces and matte-charcoal side faces just like the logo).
 */
function addBox(
  b: MeshBuilder,
  cx: number,
  cy: number,
  cz: number,
  sx: number,
  sy: number,
  sz: number,
  mats: {
    px?: number
    nx?: number
    py?: number
    ny?: number
    pz?: number
    nz?: number
    all: number
  },
  part = 0,
  rotY = 0,
  rotZ = 0
) {
  const hx = sx / 2
  const hy = sy / 2
  const hz = sz / 2

  const cyRot = Math.cos(rotY)
  const syRot = Math.sin(rotY)
  const czRot = Math.cos(rotZ)
  const szRot = Math.sin(rotZ)

  function xform(vx: number, vy: number, vz: number): [number, number, number] {
    // Rotate Z first, then Y
    const x1 = vx * czRot - vy * szRot
    const y1 = vx * szRot + vy * czRot
    const z1 = vz

    const x2 = x1 * cyRot + z1 * syRot
    const y2 = y1
    const z2 = -x1 * syRot + z1 * cyRot
    return [x2, y2, z2]
  }

  const faces: Array<{
    n: [number, number, number]
    v: Array<[number, number, number, number, number]>
    m: number
  }> = [
    // +X face
    {
      n: [1, 0, 0],
      m: mats.px ?? mats.all,
      v: [
        [hx, -hy, hz, 0, 0],
        [hx, -hy, -hz, 1, 0],
        [hx, hy, -hz, 1, 1],
        [hx, hy, hz, 0, 1],
      ],
    },
    // -X face
    {
      n: [-1, 0, 0],
      m: mats.nx ?? mats.all,
      v: [
        [-hx, -hy, -hz, 0, 0],
        [-hx, -hy, hz, 1, 0],
        [-hx, hy, hz, 1, 1],
        [-hx, hy, -hz, 0, 1],
      ],
    },
    // +Y (Top) face
    {
      n: [0, 1, 0],
      m: mats.py ?? mats.all,
      v: [
        [-hx, hy, hz, 0, 0],
        [hx, hy, hz, 1, 0],
        [hx, hy, -hz, 1, 1],
        [-hx, hy, -hz, 0, 1],
      ],
    },
    // -Y (Bottom) face
    {
      n: [0, -1, 0],
      m: mats.ny ?? mats.all,
      v: [
        [-hx, -hy, -hz, 0, 0],
        [hx, -hy, -hz, 1, 0],
        [hx, -hy, hz, 1, 1],
        [-hx, -hy, hz, 0, 1],
      ],
    },
    // +Z (Front-Left) face
    {
      n: [0, 0, 1],
      m: mats.pz ?? mats.all,
      v: [
        [-hx, -hy, hz, 0, 0],
        [hx, -hy, hz, 1, 0],
        [hx, hy, hz, 1, 1],
        [-hx, hy, hz, 0, 1],
      ],
    },
    // -Z (Back-Right) face
    {
      n: [0, 0, -1],
      m: mats.nz ?? mats.all,
      v: [
        [hx, -hy, -hz, 0, 0],
        [-hx, -hy, -hz, 1, 0],
        [-hx, hy, -hz, 1, 1],
        [hx, hy, -hz, 0, 1],
      ],
    },
  ]

  for (const f of faces) {
    const baseIdx = b.positions.length / 3
    const [nx, ny, nz] = xform(f.n[0], f.n[1], f.n[2])
    for (const vert of f.v) {
      const [rx, ry, rz] = xform(vert[0], vert[1], vert[2])
      b.positions.push(cx + rx, cy + ry, cz + rz)
      b.normals.push(nx, ny, nz)
      b.uvs.push(vert[3], vert[4])
      b.mats.push(f.m)
      b.parts.push(part)
    }
    b.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3)
  }
}

/**
 * Adds a smooth 3D UV sphere with its own material and floating part ID.
 */
function addSphere(
  b: MeshBuilder,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  mat: number,
  partId: number,
  latBands = 28,
  lonBands = 36
) {
  const baseIdx = b.positions.length / 3
  for (let lat = 0; lat <= latBands; lat++) {
    const theta = (lat * Math.PI) / latBands
    const sinT = Math.sin(theta)
    const cosT = Math.cos(theta)

    for (let lon = 0; lon <= lonBands; lon++) {
      const phi = (lon * 2 * Math.PI) / lonBands
      const sinP = Math.sin(phi)
      const cosP = Math.cos(phi)

      const nx = cosP * sinT
      const ny = cosT
      const nz = sinP * sinT

      b.positions.push(cx + r * nx, cy + r * ny, cz + r * nz)
      b.normals.push(nx, ny, nz)
      b.uvs.push(lon / lonBands, lat / latBands)
      b.mats.push(mat)
      b.parts.push(partId)
    }
  }

  for (let lat = 0; lat < latBands; lat++) {
    for (let lon = 0; lon < lonBands; lon++) {
      const first = baseIdx + lat * (lonBands + 1) + lon
      const second = first + lonBands + 1
      b.indices.push(first, second, first + 1, second, second + 1, first + 1)
    }
  }
}

/**
 * Builds the complete 3D ConstructMS Isometric Architectural Sculpture:
 *  - Material 0: Matte Charcoal (#222428)
 *  - Material 1: Brushed Brass / Gold (#c59e5e)
 *  - Material 2: Graduated Brass T-Square Ruler with tick marks
 *  - Material 3: Glossy Amber Sphere
 *  - Material 4: Matte Charcoal Sphere
 *  - Material 5: Pearl Ivory Sphere
 */
function buildConstructMSSculpture(): MeshBuilder {
  const b: MeshBuilder = {
    positions: [],
    normals: [],
    uvs: [],
    mats: [],
    parts: [],
    indices: [],
  }

  const CHARCOAL = 0
  const BRASS = 1
  const RULER = 2
  const AMBER_SPHERE = 3
  const INK_SPHERE = 4
  const PEARL_SPHERE = 5

  // 1. Tall Central Vertical Pillar (Matte Charcoal)
  addBox(b, -0.18, 0.28, -0.18, 0.22, 2.55, 0.42, { all: CHARCOAL }, 0)

  // 2. Long Horizontal Base Beam running from front-left (+Z) to back-right (-Z)
  // Front-left charcoal channel section
  addBox(b, -0.05, -0.78, 0.52, 0.36, 0.22, 1.55, { all: CHARCOAL }, 0)
  // Back-right extension with Brushed Brass top face and Matte Charcoal sides
  addBox(
    b,
    -0.05,
    -0.78,
    -0.95,
    0.36,
    0.22,
    1.55,
    { all: CHARCOAL, py: BRASS, px: CHARCOAL, nx: BRASS },
    0
  )

  // 3. Front-Left L-Hook Base Foot (Matte Charcoal)
  addBox(b, 0.14, -0.78, 1.24, 0.78, 0.20, 0.22, { all: CHARCOAL }, 0)

  // 4. Outer Portal Frame — Front-Left Vertical Column (Charcoal outside, Brass inner face)
  addBox(
    b,
    -0.16,
    -0.12,
    1.22,
    0.22,
    1.46,
    0.22,
    { all: CHARCOAL, px: BRASS },
    0
  )

  // 5. Outer Portal Frame — Top-Left Horizontal Beam (Matte Charcoal, connecting front-left post to center)
  addBox(b, -0.16, 0.52, 0.52, 0.22, 0.22, 1.62, { all: CHARCOAL }, 0)

  // 6. Outer Portal Frame — Top-Right Beam (Brushed Brass top & outer face, Charcoal underside)
  addBox(
    b,
    0.48,
    0.76,
    -0.18,
    1.48,
    0.22,
    0.24,
    { all: CHARCOAL, py: BRASS, pz: BRASS, px: BRASS },
    0
  )

  // 7. Outer Portal Frame — Front-Right Vertical Column (Matte Charcoal)
  addBox(
    b,
    1.12,
    -0.02,
    -0.18,
    0.24,
    1.52,
    0.24,
    { all: CHARCOAL, py: BRASS },
    0
  )

  // 8. Inner Nested Brushed-Brass Portal Frame (Top Beam + Vertical Post)
  addBox(b, 0.26, 0.28, 0.24, 0.92, 0.17, 0.18, { all: BRASS }, 1)
  addBox(b, 0.64, -0.44, 0.24, 0.18, 1.56, 0.18, { all: BRASS }, 1)

  // 9. Graduated Brushed-Brass T-Square Ruler threading through the structure!
  // Long graduated ruler blade running along X (from upper-left -X to lower-right +X)
  addBox(
    b,
    0.22,
    -0.14,
    0.66,
    3.45,
    0.09,
    0.38,
    { all: BRASS, py: RULER },
    2,
    0,
    -0.14 // Slight downward slope from upper-left to lower-right
  )

  // T-Square Crosshead at upper-left end of the blade
  addBox(
    b,
    -1.38,
    0.08,
    0.66,
    0.32,
    0.11,
    1.42,
    { all: BRASS },
    2,
    0,
    -0.14
  )
  // T-Square Beveled Shoulder Reinforcement
  addBox(
    b,
    -1.18,
    0.06,
    0.66,
    0.28,
    0.10,
    0.76,
    { all: BRASS },
    2,
    0,
    -0.14
  )

  // 10. The 7 Signature Floating 3D Spheres around & inside the structure
  // (1) Large Glossy Amber Sphere (upper-left of central pillar)
  addSphere(b, -0.58, 0.94, 0.36, 0.34, AMBER_SPHERE, 10)
  // (2) Medium Matte Charcoal Sphere (upper-right above brass beam)
  addSphere(b, 0.42, 1.32, -0.62, 0.23, INK_SPHERE, 11)
  // (3) Small Pearl Ivory Sphere (far right-top)
  addSphere(b, 1.24, 0.78, -0.88, 0.145, PEARL_SPHERE, 12)
  // (4) Medium Matte Charcoal Sphere (far right-mid)
  addSphere(b, 1.56, -0.08, -0.52, 0.19, INK_SPHERE, 13)
  // (5) Large Pearl Ivory Sphere (lower-right resting near the brass ruler blade)
  addSphere(b, 1.24, -0.22, 0.36, 0.32, PEARL_SPHERE, 14)
  // (6) Medium Matte Charcoal Sphere (lower-left)
  addSphere(b, -0.62, -0.46, 1.28, 0.185, INK_SPHERE, 15)
  // (7) Tiny Glossy Amber Sphere (nestled inside the front-left charcoal base channel)
  addSphere(b, 0.08, -0.62, 1.12, 0.085, AMBER_SPHERE, 16)

  return b
}

export default function FabricSculpture({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: false,
    })
    if (!gl) return

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) return

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return
    gl.useProgram(program)

    const mesh = buildConstructMSSculpture()

    function bindAttr(name: string, data: Float32Array, size: number) {
      const buf = gl!.createBuffer()
      gl!.bindBuffer(gl!.ARRAY_BUFFER, buf)
      gl!.bufferData(gl!.ARRAY_BUFFER, data, gl!.STATIC_DRAW)
      const loc = gl!.getAttribLocation(program, name)
      if (loc >= 0) {
        gl!.enableVertexAttribArray(loc)
        gl!.vertexAttribPointer(loc, size, gl!.FLOAT, false, 0, 0)
      }
      return buf
    }

    const posBuf = bindAttr('aPos', new Float32Array(mesh.positions), 3)
    const normBuf = bindAttr('aNormal', new Float32Array(mesh.normals), 3)
    const uvBuf = bindAttr('aUv', new Float32Array(mesh.uvs), 2)
    const matBuf = bindAttr('aMat', new Float32Array(mesh.mats), 1)
    const partBuf = bindAttr('aPart', new Float32Array(mesh.parts), 1)

    const idxBuf = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf)
    const indexArray = new Uint16Array(mesh.indices)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexArray, gl.STATIC_DRAW)

    const uProj = gl.getUniformLocation(program, 'uProj')
    const uView = gl.getUniformLocation(program, 'uView')
    const uModel = gl.getUniformLocation(program, 'uModel')
    const uTime = gl.getUniformLocation(program, 'uTime')

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.cullFace(gl.BACK)
    gl.clearColor(0, 0, 0, 0)

    function resize() {
      if (!canvas || !gl) return
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = Math.max(1, Math.floor(canvas.clientWidth * dpr))
      const h = Math.max(1, Math.floor(canvas.clientHeight * dpr))
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      gl.viewport(0, 0, w, h)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    resize()

    // Accurate 3D rotation state: responds to both hover movement AND direct click-and-drag orbiting
    const hover = { x: 0, y: 0 }
    const dragOffset = { x: 0, y: 0 }
    const smoothRot = { x: 0, y: 0 }
    let dragging = false
    let lastPointer = { x: 0, y: 0 }

    function onWindowPointerMove(e: PointerEvent) {
      // Normalized cursor position relative to the sculpture canvas center
      if (canvas) {
        const rect = canvas.getBoundingClientRect()
        const cx = rect.left + rect.width * 0.5
        const cy = rect.top + rect.height * 0.5
        hover.x = Math.max(-1.2, Math.min(1.2, (e.clientX - cx) / (window.innerWidth * 0.45)))
        hover.y = Math.max(-1.2, Math.min(1.2, (e.clientY - cy) / (window.innerHeight * 0.45)))
      }

      if (dragging) {
        const dx = e.clientX - lastPointer.x
        const dy = e.clientY - lastPointer.y
        lastPointer = { x: e.clientX, y: e.clientY }
        dragOffset.y += dx * 0.0085
        dragOffset.x = Math.max(-0.85, Math.min(0.85, dragOffset.x + dy * 0.0075))
      }
    }

    function onPointerDown(e: PointerEvent) {
      dragging = true
      setIsDragging(true)
      lastPointer = { x: e.clientX, y: e.clientY }
      canvas?.setPointerCapture?.(e.pointerId)
    }

    function onPointerUp(e: PointerEvent) {
      if (!dragging) return
      dragging = false
      setIsDragging(false)
      canvas?.releasePointerCapture?.(e.pointerId)
    }

    window.addEventListener('pointermove', onWindowPointerMove, { passive: true })
    canvas.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)

    const start = performance.now()
    let raf = 0
    let firstFrame = true

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      if (!canvas || !gl) return

      const t = (now - start) / 1000

      // When not dragging, gently spring-relax any drag spin back toward the signature isometric angle
      if (!dragging) {
        dragOffset.x *= 0.965
        dragOffset.y *= 0.965
      }

      // Target 3D rotation combines natural cursor tracking + direct drag orbit
      const targetPitch = 0.52 + hover.y * 0.38 + dragOffset.x
      const targetYaw = -0.76 + hover.x * 0.55 + dragOffset.y + Math.sin(t * 0.45) * 0.04

      smoothRot.x += (targetPitch - smoothRot.x) * 0.1
      smoothRot.y += (targetYaw - smoothRot.y) * 0.1

      const aspect = canvas.width / canvas.height
      const proj = perspective((32 * Math.PI) / 180, aspect, 0.1, 50)
      const view = translate(0, -0.05, -6.3)

      let model = translate(0, Math.sin(t * 0.9) * 0.04, 0)
      model = multiply(model, rotateX(smoothRot.x))
      model = multiply(model, rotateY(smoothRot.y))
      model = multiply(model, rotateZ(hover.x * -0.05))

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.uniformMatrix4fv(uProj, false, proj)
      gl.uniformMatrix4fv(uView, false, view)
      gl.uniformMatrix4fv(uModel, false, model)
      gl.uniform1f(uTime, t)

      gl.drawElements(gl.TRIANGLES, indexArray.length, gl.UNSIGNED_SHORT, 0)

      if (firstFrame) {
        firstFrame = false
        setReady(true)
      }
    }

    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onWindowPointerMove)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      resizeObserver.disconnect()
      gl.deleteBuffer(posBuf)
      gl.deleteBuffer(normBuf)
      gl.deleteBuffer(uvBuf)
      gl.deleteBuffer(matBuf)
      gl.deleteBuffer(partBuf)
      gl.deleteBuffer(idxBuf)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [])

  return (
    <div className={`${className} relative flex items-center justify-center`}>
      {/* Soft warm studio floor shadow underneath the 3D WebGL sculpture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[12%] h-20 w-[56%] rounded-full blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(35, 25, 12, 0.22) 0%, rgba(35, 25, 12, 0.08) 55%, transparent 80%)',
        }}
      />

      <canvas
        ref={canvasRef}
        title="Move cursor or drag to rotate 3D ConstructMS sculpture"
        className={`pointer-events-auto h-full w-full transition-opacity duration-1000 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        } ${ready ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
