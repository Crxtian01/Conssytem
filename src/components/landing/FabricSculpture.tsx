'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Abstract fabric sculpture rendered with raw WebGL (no external 3D library).
 * A twisting silk ribbon with layered folds, soft studio lighting,
 * specular sheen, an amber underside, and subtle mouse-driven tilt.
 */

const VERTEX_SHADER = `
attribute vec2 aUv;

uniform mat4 uProj;
uniform mat4 uModel;
uniform float uTime;
uniform vec2 uMouse;

varying vec3 vNormal;
varying vec3 vPos;
varying float vFold;

vec3 sculpt(float s, float w, out float fold) {
  float t = uTime;

  // Spine of the ribbon: a slow, breathing S-curve
  vec3 spine = vec3(
    s * 1.75,
    0.32 * sin(s * 2.1 + t * 0.35) + uMouse.y * 0.10 * s,
    0.38 * cos(s * 1.5 + t * 0.28)
  );

  // Twist along the length, nudged by the pointer
  float a = s * 2.3 + sin(t * 0.25) * 0.7 + uMouse.x * 0.55;
  vec3 across = vec3(0.0, cos(a), sin(a));
  vec3 normal = vec3(0.0, -sin(a), cos(a));

  // Ribbon tapers toward both ends
  float width = 0.64 * (1.0 - 0.3 * s * s);

  // Layered folds (large drape + fine creases)
  float f =
      0.080 * sin(w * 7.5 + s * 3.2 + t * 1.05)
    + 0.042 * sin(w * 14.0 - s * 5.0 + t * 0.80)
    + 0.026 * sin(s * 12.0 + w * 4.0 + t * 1.50)
    + 0.012 * sin(w * 31.0 + s * 9.0 - t * 1.20);

  fold = f;
  return spine + across * w * width + normal * f;
}

void main() {
  float s = (aUv.x - 0.5) * 2.0;
  float w = (aUv.y - 0.5) * 2.0;
  float e = 0.004;

  float fold;
  float tmp;
  vec3 p  = sculpt(s, w, fold);
  vec3 ps = sculpt(s + e, w, tmp);
  vec3 pw = sculpt(s, w + e, tmp);
  vec3 n  = normalize(cross(ps - p, pw - p));

  vec4 world = uModel * vec4(p, 1.0);
  vPos = world.xyz;
  vNormal = (uModel * vec4(n, 0.0)).xyz;
  vFold = fold;
  gl_Position = uProj * world;
}
`

const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec3 vNormal;
varying vec3 vPos;
varying float vFold;

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(-vPos);
  bool front = gl_FrontFacing;
  if (!front) N = -N;

  vec3 keyL  = normalize(vec3(-0.55, 0.85, 0.65));
  vec3 fillL = normalize(vec3(0.75, -0.25, 0.45));

  // Wrapped diffuse for a soft, cloth-like falloff
  float keyD  = clamp((dot(N, keyL) + 0.35) / 1.35, 0.0, 1.0);
  float fillD = clamp((dot(N, fillL) + 0.25) / 1.25, 0.0, 1.0);
  float diffuse = keyD * 0.78 + fillD * 0.26;

  vec3 H = normalize(keyL + V);
  float spec  = pow(max(dot(N, H), 0.0), 46.0) * 0.42;
  float sheen = pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.38;

  // Fake ambient occlusion inside the folds
  float occ = smoothstep(-0.13, 0.11, vFold) * 0.38 + 0.62;

  vec3 silk  = vec3(0.955, 0.925, 0.875);
  vec3 amber = vec3(0.93, 0.56, 0.18);
  vec3 base  = front ? silk : amber;

  vec3 col = base * (0.26 + diffuse * 0.86) * occ;
  col += spec * vec3(1.0, 0.97, 0.92);
  col += sheen * (front ? vec3(1.0, 0.86, 0.62) : vec3(1.0, 0.78, 0.45));

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

export default function FabricSculpture({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: true,
      premultipliedAlpha: true,
    })
    if (!gl) {
      setFailed(true)
      return
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vs || !fs) {
      setFailed(true)
      return
    }

    const program = gl.createProgram()!
    gl.attachShader(program, vs)
    gl.attachShader(program, fs)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setFailed(true)
      return
    }
    gl.useProgram(program)

    // Build a dense grid (length x width) for smooth folds
    const SEG_S = 200
    const SEG_W = 90
    const uvs = new Float32Array((SEG_S + 1) * (SEG_W + 1) * 2)
    let i = 0
    for (let y = 0; y <= SEG_W; y++) {
      for (let x = 0; x <= SEG_S; x++) {
        uvs[i++] = x / SEG_S
        uvs[i++] = y / SEG_W
      }
    }
    const indices = new Uint16Array(SEG_S * SEG_W * 6)
    let j = 0
    for (let y = 0; y < SEG_W; y++) {
      for (let x = 0; x < SEG_S; x++) {
        const a = y * (SEG_S + 1) + x
        const b = a + 1
        const c = a + (SEG_S + 1)
        const d = c + 1
        indices[j++] = a
        indices[j++] = c
        indices[j++] = b
        indices[j++] = b
        indices[j++] = c
        indices[j++] = d
      }
    }

    const uvBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW)
    const aUv = gl.getAttribLocation(program, 'aUv')
    gl.enableVertexAttribArray(aUv)
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 0, 0)

    const indexBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW)

    const uProj = gl.getUniformLocation(program, 'uProj')
    const uModel = gl.getUniformLocation(program, 'uModel')
    const uTime = gl.getUniformLocation(program, 'uTime')
    const uMouse = gl.getUniformLocation(program, 'uMouse')

    gl.enable(gl.DEPTH_TEST)
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

    // Pointer tracking with smoothing
    const target = { x: 0, y: 0 }
    const smooth = { x: 0, y: 0 }
    function onPointerMove(e: PointerEvent) {
      target.x = (e.clientX / window.innerWidth) * 2 - 1
      target.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })

    // Pause rendering when off-screen
    let visible = true
    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true
    })
    io.observe(canvas)

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    let raf = 0
    let firstFrame = true

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      if (!visible || !canvas || !gl) return

      const t = reducedMotion ? 6 : (now - start) / 1000
      smooth.x += (target.x - smooth.x) * 0.045
      smooth.y += (target.y - smooth.y) * 0.045

      const aspect = canvas.width / canvas.height
      const proj = perspective((34 * Math.PI) / 180, aspect, 0.1, 50)
      let model = translate(0, 0, -5.4)
      model = multiply(model, rotateX(0.22 + smooth.y * 0.16))
      model = multiply(model, rotateY(-0.28 + smooth.x * 0.3))
      model = multiply(model, rotateZ(-0.32 + Math.sin(t * 0.18) * 0.05))

      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
      gl.uniformMatrix4fv(uProj, false, proj)
      gl.uniformMatrix4fv(uModel, false, model)
      gl.uniform1f(uTime, t)
      gl.uniform2f(uMouse, smooth.x, smooth.y)
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)

      if (firstFrame) {
        firstFrame = false
        setReady(true)
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      resizeObserver.disconnect()
      io.disconnect()
      gl.deleteBuffer(uvBuffer)
      gl.deleteBuffer(indexBuffer)
      gl.deleteProgram(program)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
    }
  }, [])

  if (failed) {
    // Graceful fallback when WebGL is unavailable
    return (
      <div
        aria-hidden="true"
        className={`${className} rounded-full blur-2xl opacity-80`}
        style={{
          background:
            'radial-gradient(ellipse at 40% 40%, #fff8ec 0%, #f1e4cf 35%, #e7a85a 70%, transparent 100%)',
        }}
      />
    )
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`${className} transition-[opacity,transform] duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        ready ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
    />
  )
}

