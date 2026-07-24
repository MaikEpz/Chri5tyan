import { useEffect, useMemo, useState } from "react";
import verticalStudio from "../../../assets/quotes/studio/studio-vertical-base.webp";
import horizontalStudio from "../../../assets/quotes/studio/studio-horizontal-base.webp";
import cinemaCamera from "../../../assets/quotes/studio/cinema-camera.webp";
import softboxLight from "../../../assets/quotes/studio/softbox-light.webp";
import castingPerson1 from "../../../assets/quotes/studio/casting-person-1.webp";
import castingPerson2 from "../../../assets/quotes/studio/casting-person-2.webp";
import castingPerson3 from "../../../assets/quotes/studio/casting-person-3.webp";
import castingPerson4 from "../../../assets/quotes/studio/casting-person-4.webp";
import gafferAssistant from "../../../assets/quotes/studio/gaffer-assistant.webp";
import makeupStation from "../../../assets/quotes/studio/makeup-station.webp";
import soundOperator from "../../../assets/quotes/studio/sound-operator.webp";
import photoEquipment from "../../../assets/quotes/studio/photo-equipment.webp";
import smokeMachine from "../../../assets/quotes/studio/smoke-machine.webp";
import droneKit from "../../../assets/quotes/studio/drone-kit.webp";
import teleprompter from "../../../assets/quotes/studio/teleprompter.webp";
import { PRODUCTION_TYPE } from "../../../domain/production/productionTypes.js";
import { describeQuoteScene, getQuoteSceneLayers } from "./quoteScene.js";

const ASSETS = Object.freeze({
  camera: cinemaCamera,
  softbox: softboxLight,
  casting: [
    castingPerson1,
    castingPerson2,
    castingPerson3,
    castingPerson4,
  ],
  gaffer: gafferAssistant,
  makeup: makeupStation,
  sound: soundOperator,
  photo: photoEquipment,
  smoke: smokeMachine,
  drone: droneKit,
  teleprompter,
});

const VERTICAL_COMPOSITION = Object.freeze({
  camera: [
    { left: "5%", bottom: "-16%", width: "36%", z: 18 },
    { right: "4%", bottom: "-14%", width: "34%", z: 18, flip: true },
    { left: "25%", bottom: "-21%", width: "34%", z: 19 },
    { right: "25%", bottom: "-22%", width: "32%", z: 19, flip: true },
  ],
  light: [
    { left: "-5%", bottom: "2%", width: "29%", z: 6 },
    { right: "-5%", bottom: "2%", width: "29%", z: 6, flip: true },
    { left: "13%", bottom: "16%", width: "22%", z: 5, flip: true },
    { right: "13%", bottom: "16%", width: "22%", z: 5 },
    { left: "31%", bottom: "25%", width: "18%", z: 4 },
    { right: "31%", bottom: "25%", width: "18%", z: 4, flip: true },
  ],
  casting: [
    { left: "39%", bottom: "4%", width: "22%", z: 11 },
    { left: "27%", bottom: "4%", width: "20%", z: 10 },
    { right: "26%", bottom: "4%", width: "20%", z: 10 },
    { right: "16%", bottom: "4%", width: "19%", z: 9 },
  ],
  makeup: [{ right: "1%", bottom: "3%", width: "25%", z: 12 }],
  sound: [{ left: "2%", bottom: "2%", width: "27%", z: 13 }],
  gaffer: [{ right: "8%", bottom: "4%", width: "20%", z: 8, flip: true }],
  photo: [
    { right: "17%", bottom: "-6%", width: "21%", z: 16 },
    { left: "16%", bottom: "-8%", width: "18%", z: 15, flip: true },
    { right: "36%", bottom: "-10%", width: "17%", z: 15 },
  ],
  smoke: [{ left: "35%", bottom: "-4%", width: "20%", z: 14 }],
  drone: [{ right: "7%", top: "7%", width: "21%", z: 15 }],
  teleprompter: [{ left: "19%", bottom: "-4%", width: "25%", z: 17 }],
});

const HORIZONTAL_COMPOSITION = Object.freeze({
  camera: [
    { left: "1%", bottom: "-15%", width: "35%", z: 18 },
    { right: "1%", bottom: "-15%", width: "35%", z: 18, flip: true },
    { left: "26%", bottom: "-21%", width: "32%", z: 19 },
    { right: "25%", bottom: "-21%", width: "31%", z: 19, flip: true },
  ],
  light: [
    { left: "-5%", bottom: "3%", width: "28%", z: 6 },
    { right: "-5%", bottom: "3%", width: "28%", z: 6, flip: true },
    { left: "13%", bottom: "15%", width: "23%", z: 5, flip: true },
    { right: "13%", bottom: "15%", width: "23%", z: 5 },
    { left: "32%", bottom: "24%", width: "18%", z: 4 },
    { right: "32%", bottom: "24%", width: "18%", z: 4, flip: true },
  ],
  casting: [
    { left: "40%", bottom: "4%", width: "20%", z: 11 },
    { left: "30%", bottom: "4%", width: "18%", z: 10 },
    { right: "29%", bottom: "4%", width: "18%", z: 10 },
    { right: "19%", bottom: "4%", width: "17%", z: 9 },
  ],
  makeup: [{ right: "1%", bottom: "1%", width: "23%", z: 12 }],
  sound: [{ left: "1%", bottom: "2%", width: "25%", z: 13 }],
  gaffer: [{ right: "12%", bottom: "3%", width: "19%", z: 8, flip: true }],
  photo: [
    { right: "20%", bottom: "-8%", width: "20%", z: 16 },
    { left: "19%", bottom: "-9%", width: "18%", z: 15, flip: true },
    { right: "39%", bottom: "-10%", width: "16%", z: 15 },
  ],
  smoke: [{ left: "37%", bottom: "-6%", width: "19%", z: 14 }],
  drone: [{ right: "9%", top: "8%", width: "19%", z: 15 }],
  teleprompter: [{ left: "20%", bottom: "-5%", width: "24%", z: 17 }],
});

function getLayerAsset(layer) {
  if (layer.kind === "casting") {
    return ASSETS.casting[layer.slot % ASSETS.casting.length];
  }
  return ASSETS[layer.asset];
}

function getLayerStyle(layer, composition) {
  const slots = composition[layer.kind];
  const slot = slots[layer.slot % slots.length];
  return {
    left: slot.left,
    right: slot.right,
    top: slot.top,
    bottom: slot.bottom,
    width: slot.width,
    zIndex: slot.z,
    "--quote-layer-flip": slot.flip ? -1 : 1,
  };
}

function useAnimatedLayers(activeLayers) {
  const [renderedLayers, setRenderedLayers] = useState(() => activeLayers);

  useEffect(() => {
    const activeIds = new Set(activeLayers.map((layer) => layer.id));
    setRenderedLayers((previousLayers) => [
      ...activeLayers.map((layer) => ({ ...layer, isExiting: false })),
      ...previousLayers
        .filter((layer) => !activeIds.has(layer.id))
        .map((layer) => ({ ...layer, isExiting: true })),
    ]);

    const cleanupTimer = window.setTimeout(() => {
      setRenderedLayers((layers) => layers.filter((layer) => !layer.isExiting));
    }, 180);

    return () => window.clearTimeout(cleanupTimer);
  }, [activeLayers]);

  return renderedLayers;
}

export function QuoteStudioPreview({ quote, production }) {
  const isVertical = production.id === PRODUCTION_TYPE.REEL;
  const composition = isVertical
    ? VERTICAL_COMPOSITION
    : HORIZONTAL_COMPOSITION;
  const background = isVertical ? verticalStudio : horizontalStudio;
  const activeLayers = useMemo(
    () => getQuoteSceneLayers(quote, production),
    [quote, production],
  );
  const layers = useAnimatedLayers(activeLayers);

  return (
    <figure
      className="quote-studio-preview"
      aria-label={describeQuoteScene(quote, production)}
    >
      <img
        className="quote-studio-background"
        src={background}
        alt=""
        decoding="async"
        loading="eager"
      />
      <figcaption>
        <span>Set en tiempo real</span>
        <strong>{production.format}</strong>
      </figcaption>
      <div className="quote-studio-layers" aria-hidden="true">
        {layers.map((layer) => (
          <img
            key={layer.id}
            className={`quote-studio-layer is-${layer.kind}${layer.isExiting ? " is-exiting" : ""}`}
            src={getLayerAsset(layer)}
            alt=""
            decoding="async"
            style={getLayerStyle(layer, composition)}
          />
        ))}
      </div>
    </figure>
  );
}
