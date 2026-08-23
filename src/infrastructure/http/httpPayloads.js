export function queryString(parameters) {
  const query = new URLSearchParams();
  Object.entries(parameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, String(value));
  });
  const serialized = query.toString();
  return serialized ? `?${serialized}` : "";
}

export function imageMultipart(data, images = []) {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  Array.from(images || []).forEach((image) => formData.append("images", image));
  return formData;
}

export function portfolioMultipart(data, media, cover) {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  if (media) formData.append("media", media);
  if (cover) formData.append("cover", cover);
  return formData;
}
