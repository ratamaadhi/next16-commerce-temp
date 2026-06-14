const testimonials = [
  {
    name: "Dina",
    text: "Kualitas produknya benar-benar luar biasa. Desainnya bold dan elegan, sangat memuaskan.",
  },
  {
    name: "Rina",
    text: "Pengalaman belanja yang premium. Koleksinya unique dan nggak pasaran.",
  },
  {
    name: "Mira",
    text: "Estetikanya dark dan sophisticated, pas banget buat yang suka gaya editorial.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-background border-t">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-16 tracking-tight font-[family-name:var(--font-heading)]">
          What They Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="flex flex-col gap-6 p-8 bg-muted">
              <p className="text-lg text-foreground leading-relaxed font-medium">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground uppercase tracking-widest">
                {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
