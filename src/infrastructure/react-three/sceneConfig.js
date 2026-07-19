import * as THREE from "three";

export const CAMERA = {
  position: new THREE.Vector3(-0.04805, 9.3375, -0.8571),
  target: new THREE.Vector3(-10.1, 6.25, -3.5),
};

export const SCROLL_LOOK = {
  smoothing: 6,
  maxLeftYawOffset: THREE.MathUtils.degToRad(5),
  maxRightYawOffset: THREE.MathUtils.degToRad(5),
  maxUpPitchOffset: THREE.MathUtils.degToRad(5),
  maxDownPitchOffset: THREE.MathUtils.degToRad(5),
};

export const SCREEN_CONTENT_OFFSET_X = 0;

export const EMISSIVE_LIGHT_MATERIALS = new Map([
  ["m_lamp", { color: "#ffd27a", intensity: 13, distance: 7.4, glowScale: 0.35 }],
]);

export const SCREEN_VIEWS = [
  {
    id: "home",
    label: "Inicio",
    accent: "#ffffff",
    eyebrow: "Chris Studio",
    title: "Panel creativo",
    copy: "Una experiencia web compacta dentro del monitor.",
    stat: "Live",
  },
  {
    id: "stats",
    label: "Datos",
    accent: "#d9d9d9",
    eyebrow: "Analytics",
    title: "Actividad",
    copy: "Estado, progreso y senales visuales del espacio.",
    stat: "92%",
  },
  {
    id: "alert",
    label: "Alerta",
    accent: "#b8b8b8",
    eyebrow: "Sistema",
    title: "Revision",
    copy: "Acciones rapidas para controlar la escena.",
    stat: "3",
  },
];
