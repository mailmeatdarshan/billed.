"use client";

import { useEffect, useRef, useCallback } from "react";

const VERTEX_SHADER = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_time;
  uniform float u_glow_intensity;
  uniform float u_fade_offset;

  vec3 getLight(vec2 p, vec2 mouse) {
    vec2 dir = p - mouse;
    dir.y -= u_fade_offset;

    float rad = 28.0 * 3.14159 / 180.0;
    float s = sin(rad);
    float c = cos(rad);

    vec2 tubeDir = vec2(
      dir.x * c + dir.y * s,
      -dir.x * s + dir.y * c
    );

    float stretch = tubeDir.y < 0.0 ? 3.5 : 0.7;
    vec2 rocketDir = vec2(tubeDir.x * 2.5, tubeDir.y / stretch);
    float dist = length(rocketDir);

    vec3 color = vec3(0.82, 0.84, 0.88);

    float absoluteY = p.x * c + p.y * s;
    float phase = absoluteY * 8.0 - u_time * 0.05;
    float colorPush = sin(phase * 6.28318 + dir.y * 12.0) * 0.2;

    float chromeFactor = smoothstep(0.3 + colorPush, -1.2 + colorPush, dir.x);
    color = mix(color, vec3(0.96, 0.97, 1.0), chromeFactor * 0.8);

    float shadowFactor = smoothstep(-0.3 + colorPush, 1.2 + colorPush, dir.x);
    color = mix(color, vec3(0.30, 0.32, 0.36), shadowFactor * 0.7);

    color = mix(color, vec3(0.72, 0.75, 0.80), exp(-dist * 2.5));

    float flow = sin(tubeDir.y * 3.0 - u_time * 1.5) * 0.5 + 0.5;
    float tailMask = smoothstep(0.0, -1.0, tubeDir.y);
    float pulse = mix(1.0, 0.7 + flow * 0.5, tailMask);

    float falloff = mix(6.0, 1.2, min(u_glow_intensity, 1.0));
    float intensity = mix(0.5, 2.5, min(u_glow_intensity, 1.0)) * u_glow_intensity;

    float glow = exp(-dist * falloff) * intensity * pulse;
    vec3 ambient = vec3(0.010, 0.010, 0.013);

    return ambient + color * glow;
  }

  void main() {
    float d = u_resolution.x / u_resolution.y;

    float speed = 0.05;
    float angle = 28.0 * 3.14159 / 180.0;
    float frequency = 8.0;
    float softness = 1.0;
    float refraction = 4.0;
    float aberration = 0.05;
    float lightAngle = -90.0 * 3.14159 / 180.0;

    float highlightSoftness = 0.55;
    float highlight = 0.45;

    float c = -u_time * speed;
    float t = cos(angle);
    float r = sin(angle);
    float h = sin(lightAngle);
    float p_light = cos(lightAngle);

    vec2 uv = gl_FragCoord.xy / u_resolution.xy;
    vec2 f = uv - 0.5;
    vec2 g = vec2(f.x * d, f.y);

    float y = g.x * t + g.y * r;
    float phase = y * frequency + c;
    float x = fract(phase) * 2.0 - 1.0;

    float T = abs(x);
    float e_pow = mix(16.0, 4.0, softness);
    float i = sign(x) * pow(T, e_pow);

    float S = 0.5 / max(frequency, 0.001);
    float M = -i * refraction * S;
    float w = M * t / d;
    float E = M * r;
    vec2 C = vec2(uv.x + w, uv.y + E);

    float R = M * aberration * 0.5;
    float N = R * t / d;
    float P = R * r;

    vec2 C_R = vec2(C.x + N, C.y + P);
    vec2 C_B = vec2(C.x - N, C.y - P);

    vec2 worldR = C_R * 2.0 - 1.0; worldR.x *= d;
    vec2 worldG = C * 2.0 - 1.0;   worldG.x *= d;
    vec2 worldB = C_B * 2.0 - 1.0; worldB.x *= d;

    vec2 mouse = (u_mouse.xy * 2.0 - u_resolution.xy) / u_resolution.y;

    vec3 colR = getLight(worldR, mouse);
    vec3 colG = getLight(worldG, mouse);
    vec3 colB = getLight(worldB, mouse);

    vec3 refractedColor = vec3(colR.r, colG.g, colB.b);

    float U = min(i * i, 1.0);
    float B = sqrt(1.0 - U);
    float O = max(i * h + B * p_light, 0.0);

    float glassVolume = mix(0.2, 1.0, B);

    vec2 noiseCoord = gl_FragCoord.xy * 0.6;
    float noise = fract(sin(dot(noiseCoord, vec2(12.9898, 78.233))) * 43758.5453);

    vec3 finalColor = refractedColor * glassVolume + (noise - 0.5) * 0.04;

    float k = exp2(8.0 - highlightSoftness * 7.0);
    float V = pow(1.0 - B, 5.0);
    float z = 0.04 + 0.96 * V;
    float G = pow(O, k) * z * highlight;

    float mouseDist = length(worldG - mouse);
    float localLight = exp(-mouseDist * 1.5) * u_glow_intensity;
    float dynamicBoost = 1.0 + localLight * 0.8;

    vec3 highlightColor = vec3(0.90, 0.92, 0.96) * dynamicBoost;
    finalColor += highlightColor * G;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);

  const mouseRef = useRef({ x: 0, y: 0 });
  const smoothMouseRef = useRef({ x: 0, y: 0 });
  const startTimeRef = useRef(0);
  const currentGlowRef = useRef(0.0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const fadeOffsetRef = useRef(0.0);

  const createShader = useCallback(
    (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
      return shader;
    },
    [],
  );

  const initGL = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      antialias: false,
      alpha: false,
      powerPreference: "high-performance",
    });
    if (!gl) return;
    glRef.current = gl;

    const vertShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vertShader || !fragShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    programRef.current = program;
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    const posAttr = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
  }, [createShader]);

  useEffect(() => {
    const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    mouseRef.current = { ...center };
    smoothMouseRef.current = { ...center };
    lastMousePosRef.current = { ...center };
    startTimeRef.current = Date.now();

    initGL();

    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      if (glRef.current) {
        glRef.current.viewport(0, 0, canvas.width, canvas.height);
      }
    };

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      const gl = glRef.current;
      const program = programRef.current;
      const canvas = canvasRef.current;

      if (!gl || !program || !canvas) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      smoothMouseRef.current.x +=
        (mouseRef.current.x - smoothMouseRef.current.x) * 0.08;
      smoothMouseRef.current.y +=
        (mouseRef.current.y - smoothMouseRef.current.y) * 0.08;

      const dx = smoothMouseRef.current.x - lastMousePosRef.current.x;
      const dy = smoothMouseRef.current.y - lastMousePosRef.current.y;
      const speed = Math.sqrt(dx * dx + dy * dy);

      const targetIntensity =
        speed > 0.1 ? Math.min(0.15 + speed * 0.05, 1.5) : 0.0;
      const fadeSpeed = targetIntensity > currentGlowRef.current ? 0.2 : 0.015;
      currentGlowRef.current +=
        (targetIntensity - currentGlowRef.current) * fadeSpeed;

      if (speed <= 0.1 && currentGlowRef.current > 0.001) {
        fadeOffsetRef.current += (0.5 - fadeOffsetRef.current) * 0.003;
      } else if (speed > 0.1) {
        fadeOffsetRef.current += (0.0 - fadeOffsetRef.current) * 0.15;
      }

      lastMousePosRef.current = { ...smoothMouseRef.current };

      const time = (Date.now() - startTimeRef.current) / 1000;
      const dpr = Math.min(window.devicePixelRatio, 2);

      gl.uniform2f(
        gl.getUniformLocation(program, "u_resolution"),
        canvas.width,
        canvas.height,
      );
      gl.uniform2f(
        gl.getUniformLocation(program, "u_mouse"),
        smoothMouseRef.current.x * dpr,
        (window.innerHeight - smoothMouseRef.current.y) * dpr,
      );
      gl.uniform1f(gl.getUniformLocation(program, "u_time"), time);
      gl.uniform1f(
        gl.getUniformLocation(program, "u_glow_intensity"),
        currentGlowRef.current,
      );
      gl.uniform1f(
        gl.getUniformLocation(program, "u_fade_offset"),
        fadeOffsetRef.current,
      );

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [initGL]);

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
