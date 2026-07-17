export function SceneLighting({ useFallback }) {
  if (!useFallback) return null;

  return (
    <>
      <hemisphereLight color="#8fb5c8" intensity={0.5} groundColor="#2f1a13" />
      <directionalLight color="#dcefff" position={[4, 6, 4]} intensity={0.1} />
    </>
  );
}
