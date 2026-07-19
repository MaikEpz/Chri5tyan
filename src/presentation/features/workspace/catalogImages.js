import anaTorresUrl from "../../../assets/examples/casting/ana-torres.jpg";
import diegoMoralesUrl from "../../../assets/examples/casting/diego-morales.jpg";
import aputure600dUrl from "../../../assets/examples/equipment/aputure-600d.jpg";
import sonyFx3Url from "../../../assets/examples/equipment/sony-fx3.jpg";
import casaRioUrl from "../../../assets/examples/locations/casa-rio.jpg";
import loftUrdesaUrl from "../../../assets/examples/locations/loft-urdesa.jpg";

const CATALOG_IMAGES = Object.freeze({
  "casting-ana-torres": anaTorresUrl,
  "casting-diego-morales": diegoMoralesUrl,
  "equipment-aputure-600d": aputure600dUrl,
  "equipment-sony-fx3": sonyFx3Url,
  "location-casa-rio": casaRioUrl,
  "location-loft-urdesa": loftUrdesaUrl,
});

export function getCatalogImage(imageId) {
  return CATALOG_IMAGES[imageId] ?? null;
}
