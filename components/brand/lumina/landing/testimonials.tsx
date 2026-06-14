const testimonials = [
  {
    name: "Dina",
    text: "Produknya benar-benar berkualitas. Pengiriman cepat dan packing rapi. Sangat puas belanja di sini.",
  },
  {
    name: "Rina",
    text: "Desain minimalisnya sesuai banget sama seleraku. Kualitas bahan juga premium untuk harga yang ditawarkan.",
  },
  {
    name: "Mira",
    text: "Pelayanan pelanggan sangat responsif. Barang sampai tepat waktu dan sesuai ekspektasi.",
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-background border-t">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-16 tracking-tight font-[family-name:var(--font-heading)]">
          Testimoni
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl">
          {testimonials.map((t, i) => (
            <blockquote key={i} className="flex flex-col gap-4">
              <p className="text-foreground leading-relaxed italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <footer className="text-sm text-muted-foreground">
                &mdash; {t.name}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
