// Read models used only by the application's recoverable catalog fallback.
// They intentionally stay outside the domain because names, labels and image ids
// are delivery data rather than production business rules.
export const SAMPLE_CASTING = Object.freeze([
  Object.freeze({
    id: "casting-ana-torres",
    imageId: "casting-ana-torres",
    initials: "AT",
    name: "Ana Torres",
    specialty: "Actriz comercial",
    details: ["27 años", "1.68 m", "Experiencia intermedia"],
    availability: "Tardes y fines de semana",
    budget: "$120 por jornada",
    rates: {
      hourly: { value: 20, negotiable: true },
      daily: { value: 120, negotiable: false },
    },
  }),
  Object.freeze({
    id: "casting-diego-morales",
    imageId: "casting-diego-morales",
    initials: "DM",
    name: "Diego Morales",
    specialty: "Actor audiovisual",
    details: ["34 años", "1.80 m", "Experiencia avanzada"],
    availability: "Disponibilidad completa",
    budget: "$160 por jornada",
    rates: {
      hourly: { value: 28, negotiable: false },
      daily: { value: 160, negotiable: true },
    },
  }),
]);

export const SAMPLE_LOCATIONS = Object.freeze([
  Object.freeze({
    id: "location-loft-urdesa",
    imageId: "location-loft-urdesa",
    initials: "LU",
    name: "Loft Urdesa",
    provinceId: "guayas",
    provinceName: "Guayas",
    cityId: "guayaquil",
    cityName: "Guayaquil",
    specialty: "Interior contemporáneo",
    details: ["Guayaquil, Guayas", "08:00–18:00", "Hasta 15 personas"],
    availability: "Confirmación en menos de 24 horas",
    budget: "$45 por hora",
    hourlyBudget: 45,
    hourlyBudgetNegotiable: false,
  }),
  Object.freeze({
    id: "location-casa-rio",
    imageId: "location-casa-rio",
    initials: "CR",
    name: "Casa del Río",
    provinceId: "guayas",
    provinceName: "Guayas",
    cityId: "samborondon",
    cityName: "Samborondón",
    specialty: "Casa con exteriores",
    details: ["Samborondón, Guayas", "07:00–19:00", "Exterior y piscina"],
    availability: "Sujeto a aprobación del propietario",
    budget: "$65 por hora",
    hourlyBudget: 65,
    hourlyBudgetNegotiable: true,
  }),
]);

export const SAMPLE_EQUIPMENT = Object.freeze([
  Object.freeze({
    id: "equipment-sony-fx3",
    imageId: "equipment-sony-fx3",
    initials: "FX3",
    name: "Sony FX3",
    specialty: "Cámara",
    details: ["Full Frame 4K", "Cuerpo + 2 baterías", "Montura E"],
    availability: "Disponible",
    budget: "$85 por día",
  }),
  Object.freeze({
    id: "equipment-aputure-600d",
    imageId: "equipment-aputure-600d",
    initials: "600",
    name: "Aputure 600D Pro",
    specialty: "Iluminación",
    details: ["Luz día", "Bowens Mount", "Control inalámbrico"],
    availability: "Disponible",
    budget: "$60 por día",
  }),
]);
