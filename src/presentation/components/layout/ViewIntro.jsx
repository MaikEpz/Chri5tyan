export function ViewIntro({ eyebrow, title, copy }) {
  return (
    <section className="grid max-w-3xl gap-3">
      <span className="text-xs font-bold tracking-[0.18em] text-chris-accent uppercase">{eyebrow}</span>
      <h1 className="m-0 text-[clamp(2rem,5vw,4.5rem)] leading-[0.98] font-bold tracking-tight text-white">{title}</h1>
      <p className="m-0 max-w-2xl text-base leading-relaxed text-chris-muted">{copy}</p>
    </section>
  );
}
