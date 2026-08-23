import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  GodRaysGenerateShader,
} from "three/addons/shaders/GodRaysShader.js";
import { FullScreenQuad } from "three-stdlib";
import {
  findWindowSpotlight,
  getStableWindowLightScreenPosition,
} from "./windowGodRaysUtils.js";

const GOD_RAY_INTENSITY = 1.22;
const PORTRAIT_GOD_RAY_INTENSITY = 0.72;
const GOD_RAY_RESOLUTION_SCALE = 0.34;
const TAPS_PER_PASS = 6;
const GOD_RAY_COLOR = new THREE.Color("#ffe0bd");

const combineShader = {
  uniforms: {
    rayColor: { value: GOD_RAY_COLOR.clone() },
    rayIntensity: { value: GOD_RAY_INTENSITY },
    tColors: { value: null },
    tGodRays: { value: null },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tColors;
    uniform sampler2D tGodRays;
    uniform vec3 rayColor;
    uniform float rayIntensity;

    void main() {
      vec4 sceneColor = texture2D(tColors, vUv);
      float rays = smoothstep(0.015, 0.68, texture2D(tGodRays, vUv).r);
      float edgeFade = smoothstep(0.0, 0.08, vUv.x)
        * smoothstep(0.0, 0.08, vUv.y)
        * smoothstep(0.0, 0.08, 1.0 - vUv.x)
        * smoothstep(0.0, 0.08, 1.0 - vUv.y);
      gl_FragColor = vec4(sceneColor.rgb + rayColor * rays * rayIntensity * edgeFade, sceneColor.a);
      #include <colorspace_fragment>
    }
  `,
};

const occlusionShader = {
  uniforms: {
    tColors: { value: null },
  },
  vertexShader: combineShader.vertexShader,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tColors;

    void main() {
      vec3 color = texture2D(tColors, vUv).rgb;
      float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
      float warmth = smoothstep(-0.025, 0.16, color.r - color.b);
      float source = smoothstep(0.035, 0.28, luminance) * warmth;
      gl_FragColor = vec4(vec3(source), 1.0);
    }
  `,
};

function createRenderTarget(width, height, depthBuffer = false) {
  const target = new THREE.WebGLRenderTarget(width, height, {
    depthBuffer,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter,
    stencilBuffer: false,
    type: THREE.HalfFloatType,
  });
  target.texture.colorSpace = THREE.LinearSRGBColorSpace;
  return target;
}

function createShaderMaterial(shader) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
  });
}

function getStepSize(pass) {
  return Math.pow(TAPS_PER_PASS, -pass);
}

export function WindowGodRays({ enabled = true }) {
  const { camera, gl, scene, size } = useThree();
  const dpr = gl.getPixelRatio();
  const fullWidth = Math.max(1, Math.floor(size.width * dpr));
  const fullHeight = Math.max(1, Math.floor(size.height * dpr));
  const rayWidth = Math.max(1, Math.floor(fullWidth * GOD_RAY_RESOLUTION_SCALE));
  const rayHeight = Math.max(1, Math.floor(fullHeight * GOD_RAY_RESOLUTION_SCALE));
  const spotlightRef = useRef(null);
  const sourceScreenPosition = useMemo(() => new THREE.Vector3(), []);

  const pipeline = useMemo(() => {
    const colors = createRenderTarget(fullWidth, fullHeight, true);
    const mask = createRenderTarget(fullWidth, fullHeight);
    const raysA = createRenderTarget(rayWidth, rayHeight);
    const raysB = createRenderTarget(rayWidth, rayHeight);
    const occlusionMaterial = createShaderMaterial(occlusionShader);
    const generateMaterial = createShaderMaterial(GodRaysGenerateShader);
    const combineMaterial = createShaderMaterial(combineShader);
    const occlusionQuad = new FullScreenQuad(occlusionMaterial);
    const generateQuad = new FullScreenQuad(generateMaterial);
    const combineQuad = new FullScreenQuad(combineMaterial);

    return {
      colors,
      combineMaterial,
      combineQuad,
      generateMaterial,
      generateQuad,
      mask,
      occlusionMaterial,
      occlusionQuad,
      raysA,
      raysB,
    };
  }, [fullHeight, fullWidth, rayHeight, rayWidth]);

  useEffect(() => () => {
    pipeline.colors.dispose();
    pipeline.combineMaterial.dispose();
    pipeline.combineQuad.dispose();
    pipeline.generateMaterial.dispose();
    pipeline.generateQuad.dispose();
    pipeline.mask.dispose();
    pipeline.occlusionMaterial.dispose();
    pipeline.occlusionQuad.dispose();
    pipeline.raysA.dispose();
    pipeline.raysB.dispose();
  }, [pipeline]);

  useFrame(() => {
    if (!enabled) {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      return;
    }

    const spotlight = spotlightRef.current?.parent
      ? spotlightRef.current
      : findWindowSpotlight(scene);
    spotlightRef.current = spotlight;

    if (!spotlight) {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      return;
    }

    getStableWindowLightScreenPosition(spotlight, camera, sourceScreenPosition);

    const previousAutoClear = gl.autoClear;
    const previousTarget = gl.getRenderTarget();

    gl.autoClear = false;
    gl.setRenderTarget(pipeline.colors);
    gl.clear(true, true, true);
    gl.render(scene, camera);

    pipeline.occlusionMaterial.uniforms.tColors.value = pipeline.colors.texture;
    gl.setRenderTarget(pipeline.mask);
    gl.clear(true, false, false);
    pipeline.occlusionQuad.render(gl);

    pipeline.generateMaterial.uniforms.vSunPositionScreenSpace.value.copy(sourceScreenPosition);
    pipeline.generateMaterial.uniforms.tInput.value = pipeline.mask.texture;
    pipeline.generateMaterial.uniforms.fStepSize.value = getStepSize(1);
    gl.setRenderTarget(pipeline.raysA);
    gl.clear(true, false, false);
    pipeline.generateQuad.render(gl);

    pipeline.generateMaterial.uniforms.tInput.value = pipeline.raysA.texture;
    pipeline.generateMaterial.uniforms.fStepSize.value = getStepSize(2);
    gl.setRenderTarget(pipeline.raysB);
    gl.clear(true, false, false);
    pipeline.generateQuad.render(gl);

    pipeline.generateMaterial.uniforms.tInput.value = pipeline.raysB.texture;
    pipeline.generateMaterial.uniforms.fStepSize.value = getStepSize(3);
    gl.setRenderTarget(pipeline.raysA);
    gl.clear(true, false, false);
    pipeline.generateQuad.render(gl);

    pipeline.combineMaterial.uniforms.tColors.value = pipeline.colors.texture;
    pipeline.combineMaterial.uniforms.tGodRays.value = pipeline.raysA.texture;
    pipeline.combineMaterial.uniforms.rayIntensity.value = size.width < size.height
      ? PORTRAIT_GOD_RAY_INTENSITY
      : GOD_RAY_INTENSITY;
    gl.setRenderTarget(previousTarget);
    gl.clear(true, true, true);
    pipeline.combineQuad.render(gl);
    gl.autoClear = previousAutoClear;
  }, 1);

  return null;
}
