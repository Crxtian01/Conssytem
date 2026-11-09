'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Real-time WebGL 3D Isometric Architectural Sculpture of the ConstructMS Logo.
 *
 * All structural beams, the graduated T-square ruler, and the 7 spheres are
 * constructed with non-overlapping butt-jointed geometry and high-precision
 * depth bounds so there is zero Z-fighting or flickering at any rotation angle.
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

void main() {
  vec3 p = aPos;

  // Independent 3D floating motion for the 7 spheres (aPart >= 10.0)
  if (aPart >= 10.0) {
    float idx = aPart - 10.0;
    float bob = sin(uTime * 1.45 + idx * 1.35) * 0.05;
    float swayX = cos(uTime * 0.95 + idx * 2.1) * 0.02;
    float swayZ = sin(uTime * 1.15 + idx * 1.7) * 0.02;
    p += vec3(swayX, bob, swayZ);
  }

  vec4 world = uModel * vec4(p, 1.0);
  vWorldPos = world.xyz;
  vNormal = normalize((uModel * vec4(aNormal, 0.0)).xyz);
  vUv = aUv;
  vMat = aMat;

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

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) {
    N = -N;
  }
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

  // Material 0: Matte Architectural Obsidian Titanium (#0d1322)
  if (vMat < 0.5) {
    vec3 base = vec3(0.065, 0.088, 0.135);
    float diff = 0.32 + ndlKey * 0.60 + ndlFill * 0.24 + ndlRim * 0.20;
    float spec = pow(max(dot(N, HKey), 0.0), 32.0) * 0.28;
    float edge = smoothstep(0.0, 0.035, vUv.x) * smoothstep(1.0, 0.965, vUv.x)
               * smoothstep(0.0, 0.035, vUv.y) * smoothstep(1.0, 0.965, vUv.y);
    col = base * diff + vec3(0.35, 0.75, 0.95) * spec + vec3(0.02, 0.15, 0.25) * (1.0 - edge) + vec3(0.0, 0.72, 0.90) * fresnel * 0.16;
  }
  // Material 1: Anodized Architectural Cyan-Cobalt Metallic (#06b6d4)
  else if (vMat < 1.5) {
    vec3 cyanLight = vec3(0.22, 0.84, 0.98);
    vec3 cyanDeep  = vec3(0.03, 0.36, 0.58);
    float diff = clamp(ndlKey * 0.78 + ndlFill * 0.32 + 0.18, 0.0, 1.0);
    vec3 base = mix(cyanDeep, cyanLight, diff);
    float spec = pow(max(dot(N, HKey), 0.0), 44.0) * 0.58
               + pow(max(dot(N, HFill), 0.0), 24.0) * 0.24;
    col = base + vec3(0.75, 0.95, 1.0) * spec + vec3(0.0, 0.85, 1.0) * fresnel * 0.28;
  }
  // Material 2: Graduated Brushed Titanium T-Square Blade (with glowing cyan ticks)
  else if (vMat < 2.5) {
    vec3 bladeLight = vec3(0.18, 0.30, 0.44);
    vec3 bladeDeep  = vec3(0.06, 0.12, 0.20);
    float diff = clamp(ndlKey * 0.80 + ndlFill * 0.30 + 0.20, 0.0, 1.0);
    vec3 base = mix(bladeDeep, bladeLight, diff);

    // Anti-aliased ruler graduation ticks along both long edges
    if (vUv.x > 0.04 && vUv.x < 0.96) {
      float scaleCoord = vUv.x * 56.0;
      float distToLine = abs(fract(scaleCoord + 0.5) - 0.5);
      float tickLine = 1.0 - smoothstep(0.06, 0.16, distToLine);

      float idx = floor(scaleCoord + 0.5);
      bool isMajor = mod(idx, 5.0) < 0.5;
      float edgeDist = min(vUv.y, 1.0 - vUv.y);
      float maxLen = isMajor ? 0.32 : 0.18;
      float inTick = (1.0 - smoothstep(maxLen - 0.02, maxLen + 0.02, edgeDist)) * tickLine;

      vec3 tickColor = vec3(0.12, 0.92, 1.0);
      base = mix(base, tickColor, inTick * 0.85);
    }

    float spec = pow(max(dot(N, HKey), 0.0), 48.0) * 0.55;
    col = base + vec3(0.65, 0.92, 1.0) * spec + vec3(0.0, 0.8, 1.0) * fresnel * 0.20;
  }
  // Material 3: Luminous Electric Cyan Sphere (#06b6d4)
  else if (vMat < 3.5) {
    vec3 cyanTop = vec3(0.35, 0.94, 1.0);
    vec3 cyanMid = vec3(0.04, 0.58, 0.88);
    vec3 cyanBot = vec3(0.01, 0.22, 0.42);
    float wrap = clamp((dot(N, keyLight) + 0.35) / 1.35, 0.0, 1.0);
    vec3 base = mix(cyanBot, mix(cyanMid, cyanTop, wrap), wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 64.0) * 0.85;
    col = base + vec3(0.85, 0.98, 1.0) * spec + vec3(0.15, 0.88, 1.0) * fresnel * 0.32;
  }
  // Material 4: Matte Graphite Sphere (#0b1120)
  else if (vMat < 4.5) {
    vec3 darkTop = vec3(0.18, 0.24, 0.36);
    vec3 darkBot = vec3(0.04, 0.06, 0.10);
    float wrap = clamp((dot(N, keyLight) + 0.30) / 1.30, 0.0, 1.0);
    vec3 base = mix(darkBot, darkTop, wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 36.0) * 0.38;
    col = base + vec3(0.55, 0.85, 1.0) * spec + vec3(0.1, 0.6, 0.85) * fresnel * 0.22;
  }
  // Material 5: Frosted Diamond Glass Sphere (#e0f7fa)
  else {
    vec3 pearlTop = vec3(0.88, 0.96, 1.0);
    vec3 pearlBot = vec3(0.52, 0.68, 0.82);
    float wrap = clamp((dot(N, keyLight) + 0.40) / 1.40, 0.0, 1.0);
    vec3 base = mix(pearlBot, pearlTop, wrap);
    float spec = pow(max(dot(N, HKey), 0.0), 56.0) * 0.62;
    col = base + vec3(1.0) * spec + vec3(0.40, 0.90, 1.0) * fresnel * 0.26;
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

interface FaceMaterials {
  px?: number
  nx?: number
  py?: number
  ny?: number
  pz?: number
  nz?: number
  all: number
}

/**
 * Adds a box defined by exact min/max bounds [x0..x1, y0..y1, z0..z1] so
 * adjacent structural beams meet at clean butt-joints with zero overlapping faces.
 */
function addBoxBounds(
  b: MeshBuilder,
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  mats: FaceMaterials,
  part = 0,
  pivotX = 0,
  pivotY = 0,
  pivotZ = 0,
  rotZ = 0
) {
  const cz = Math.cos(rotZ)
  const sz = Math.sin(rotZ)

  function xformPos(vx: number, vy: number, vz: number): [number, number, number] {
    if (rotZ === 0) return [vx, vy, vz]
    const dx = vx - pivotX
    const dy = vy - pivotY
    return [pivotX + dx * cz - dy * sz, pivotY + dx * sz + dy * cz, vz]
  }

  function xformNorm(nx: number, ny: number, nz: number): [number, number, number] {
    if (rotZ === 0) return [nx, ny, nz]
    return [nx * cz - ny * sz, nx * sz + ny * cz, nz]
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
        [x1, y0, z1, 0, 0],
        [x1, y0, z0, 1, 0],
        [x1, y1, z0, 1, 1],
        [x1, y1, z1, 0, 1],
      ],
    },
    // -X face
    {
      n: [-1, 0, 0],
      m: mats.nx ?? mats.all,
      v: [
        [x0, y0, z0, 0, 0],
        [x0, y0, z1, 1, 0],
        [x0, y1, z1, 1, 1],
        [x0, y1, z0, 0, 1],
      ],
    },
    // +Y (Top) face
    {
      n: [0, 1, 0],
      m: mats.py ?? mats.all,
      v: [
        [x0, y1, z1, 0, 0],
        [x1, y1, z1, 1, 0],
        [x1, y1, z0, 1, 1],
        [x0, y1, z0, 0, 1],
      ],
    },
    // -Y (Bottom) face
    {
      n: [0, -1, 0],
      m: mats.ny ?? mats.all,
      v: [
        [x0, y0, z0, 0, 0],
        [x1, y0, z0, 1, 0],
        [x1, y0, z1, 1, 1],
        [x0, y0, z1, 0, 1],
      ],
    },
    // +Z (Front-Left) face
    {
      n: [0, 0, 1],
      m: mats.pz ?? mats.all,
      v: [
        [x0, y0, z1, 0, 0],
        [x1, y0, z1, 1, 0],
        [x1, y1, z1, 1, 1],
        [x0, y1, z1, 0, 1],
      ],
    },
    // -Z (Back-Right) face
    {
      n: [0, 0, -1],
      m: mats.nz ?? mats.all,
      v: [
        [x1, y0, z0, 0, 0],
        [x0, y0, z0, 1, 0],
        [x0, y1, z0, 1, 1],
        [x1, y1, z0, 0, 1],
      ],
    },
  ]

  for (const f of faces) {
    const baseIdx = b.positions.length / 3
    const [nx, ny, nz] = xformNorm(f.n[0], f.n[1], f.n[2])
    for (const vert of f.v) {
      const [rx, ry, rz] = xformPos(vert[0], vert[1], vert[2])
      b.positions.push(rx, ry, rz)
      b.normals.push(nx, ny, nz)
      b.uvs.push(vert[3], vert[4])
      b.mats.push(f.m)
      b.parts.push(part)
    }
    b.indices.push(baseIdx, baseIdx + 1, baseIdx + 2, baseIdx, baseIdx + 2, baseIdx + 3)
  }
}

/**
 * Adds a smooth 3D UV sphere with outward counter-clockwise triangle winding.
 */
function addSphere(
  b: MeshBuilder,
  cx: number,
  cy: number,
  cz: number,
  r: number,
  mat: number,
  partId: number,
  latBands = 30,
  lonBands = 40
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
      // Outward-facing CCW winding
      b.indices.push(first, first + 1, second, second, first + 1, second + 1)
    }
  }
}

/**
 * Builds the complete 3D ConstructMS Isometric Architectural Sculpture with
 * zero overlapping or coplanar faces.
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
  // x: [-0.30, -0.08], y: [-0.88, +1.55], z: [-0.32, +0.08]
  addBoxBounds(b, -0.30, -0.08, -0.88, 1.55, -0.32, 0.08, { all: CHARCOAL }, 0)

  // 2. Long Horizontal Base Beam along Z (placed at x: [-0.08, +0.28], y: [-0.88, -0.66])
  // 2a. Front-Left Charcoal Channel Segment (z: [-0.08, +1.12])
  addBoxBounds(b, -0.08, 0.28, -0.88, -0.66, -0.08, 1.12, { all: CHARCOAL }, 0)
  // 2b. Back-Right Brass-Topped Extension Segment (z: [-1.65, -0.08])
  addBoxBounds(
    b,
    -0.08,
    0.28,
    -0.88,
    -0.66,
    -1.65,
    -0.08,
    { all: CHARCOAL, py: BRASS, nx: BRASS },
    0
  )

  // 3. Front-Left L-Hook Base Foot (z: [+1.12, +1.34], x: [-0.30, +0.52], y: [-0.88, -0.66])
  addBoxBounds(b, -0.30, 0.52, -0.88, -0.66, 1.12, 1.34, { all: CHARCOAL }, 0)

  // 4. Outer Portal Frame — Front-Left Vertical Post (stands on L-Hook Base Foot: y: [-0.66, +0.44])
  addBoxBounds(
    b,
    -0.30,
    -0.08,
    -0.66,
    0.44,
    1.12,
    1.34,
    { all: CHARCOAL, px: BRASS },
    0
  )

  // 5. Outer Portal Frame — Top-Left Horizontal Beam (y: [+0.44, +0.66], z: [+0.08, +1.34])
  addBoxBounds(b, -0.30, -0.08, 0.44, 0.66, 0.08, 1.34, { all: CHARCOAL }, 0)

  // 6. Outer Portal Frame — Top-Right Brushed-Brass Beam (x: [-0.08, +1.24], y: [+0.72, +0.94], z: [-0.30, -0.06])
  addBoxBounds(
    b,
    -0.08,
    1.24,
    0.72,
    0.94,
    -0.30,
    -0.06,
    { all: BRASS, ny: CHARCOAL, nz: CHARCOAL },
    0
  )

  // 7. Outer Portal Frame — Front-Right Vertical Column (stands under Top-Right Beam: y: [-0.78, +0.72])
  addBoxBounds(b, 1.00, 1.24, -0.78, 0.72, -0.30, -0.06, { all: CHARCOAL }, 0)

  // 8. Inner Nested Brushed-Brass Portal Frame (at z: [+0.20, +0.38])
  // 8a. Inner Brass Top Bar (x: [-0.08, +0.74], y: [+0.22, +0.40])
  addBoxBounds(b, -0.08, 0.74, 0.22, 0.40, 0.20, 0.38, { all: BRASS }, 1)
  // 8b. Inner Brass Vertical Post (stands under Inner Top Bar: x: [+0.56, +0.74], y: [-1.02, +0.22])
  addBoxBounds(b, 0.56, 0.74, -1.02, 0.22, 0.20, 0.38, { all: BRASS }, 1)

  // 9. Graduated Brushed-Brass T-Square Ruler threading through the structure (at z: [+0.50, +0.86])
  // All 4 parts share pivot (0.15, -0.10, 0.68) and tilt rotZ = -0.15 rad with zero overlap:
  const px = 0.15
  const py = -0.10
  const pz = 0.68
  const tilt = -0.15

  // 9a. Long Graduated Ruler Blade (x: [-1.18, +1.92], y: [-0.145, -0.055], z: [+0.50, +0.86])
  addBoxBounds(
    b,
    -1.18,
    1.92,
    -0.145,
    -0.055,
    0.50,
    0.86,
    { all: BRASS, py: RULER },
    2,
    px,
    py,
    pz,
    tilt
  )
  // 9b. T-Square Crosshead (x: [-1.50, -1.18], y: [-0.155, -0.045], z: [-0.04, +1.40])
  addBoxBounds(
    b,
    -1.50,
    -1.18,
    -0.155,
    -0.045,
    -0.04,
    1.40,
    { all: BRASS },
    2,
    px,
    py,
    pz,
    tilt
  )
  // 9c. T-Square Upper Shoulder Gusset (x: [-1.18, -0.94], z: [+0.86, +1.10])
  addBoxBounds(
    b,
    -1.18,
    -0.94,
    -0.145,
    -0.055,
    0.86,
    1.10,
    { all: BRASS },
    2,
    px,
    py,
    pz,
    tilt
  )
  // 9d. T-Square Lower Shoulder Gusset (x: [-1.18, -0.94], z: [+0.26, +0.50])
  addBoxBounds(
    b,
    -1.18,
    -0.94,
    -0.145,
    -0.055,
    0.26,
    0.50,
    { all: BRASS },
    2,
    px,
    py,
    pz,
    tilt
  )

  // 10. The 7 Signature Floating 3D Spheres around & inside the structure
  // (1) Large Glossy Amber Sphere (upper-left of central pillar)
  addSphere(b, -0.62, 0.96, 0.36, 0.34, AMBER_SPHERE, 10)
  // (2) Medium Matte Charcoal Sphere (upper-right above brass beam)
  addSphere(b, 0.42, 1.34, -0.62, 0.23, INK_SPHERE, 11)
  // (3) Small Pearl Ivory Sphere (far right-top)
  addSphere(b, 1.26, 0.78, -0.88, 0.145, PEARL_SPHERE, 12)
  // (4) Medium Matte Charcoal Sphere (far right-mid)
  addSphere(b, 1.58, -0.08, -0.52, 0.19, INK_SPHERE, 13)
  // (5) Large Pearl Ivory Sphere (lower-right above the brass ruler blade)
  addSphere(b, 1.24, -0.14, 0.32, 0.31, PEARL_SPHERE, 14)
  // (6) Medium Matte Charcoal Sphere (lower-left)
  addSphere(b, -0.66, -0.46, 1.28, 0.185, INK_SPHERE, 15)
  // (7) Tiny Glossy Amber Sphere (nestled above the front-left charcoal base foot)
  addSphere(b, 0.10, -0.54, 1.18, 0.085, AMBER_SPHERE, 16)

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
      depth: true,
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
    gl.depthFunc(gl.LEQUAL)
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
    const smoothRot = { x: 0.52, y: -0.76 }
    let dragging = false
    let lastPointer = { x: 0, y: 0 }

    function onWindowPointerMove(e: PointerEvent) {
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

      if (!dragging) {
        dragOffset.x *= 0.965
        dragOffset.y *= 0.965
      }

      const targetPitch = 0.52 + hover.y * 0.36 + dragOffset.x
      const targetYaw = -0.76 + hover.x * 0.52 + dragOffset.y + Math.sin(t * 0.45) * 0.035

      smoothRot.x += (targetPitch - smoothRot.x) * 0.1
      smoothRot.y += (targetYaw - smoothRot.y) * 0.1

      const aspect = canvas.width / canvas.height
      // Tight near/far clip planes (2.5 to 12.0) maximize 24-bit depth buffer precision
      const proj = perspective((32 * Math.PI) / 180, aspect, 2.5, 12.0)
      const view = translate(0, -0.05, -6.3)

      let model = translate(0, Math.sin(t * 0.9) * 0.04, 0)
      model = multiply(model, rotateX(smoothRot.x))
      model = multiply(model, rotateY(smoothRot.y))
      model = multiply(model, rotateZ(hover.x * -0.04))

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
