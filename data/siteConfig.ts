// data/siteConfig.ts
export interface SiteConfig {
  heroTitle: string;
  heroSubtitle: string;
  heroButtonText: string;
  featuredTitle: string;
  supportEmail: string;
  ads: { id: number; image: string; link: string }[];
}

export const initialConfig: SiteConfig = {
  heroTitle: "SUPER OFERTAS DE INVERNO",
  heroSubtitle: "Até 60% OFF em Eletrônicos, Moda e Casa!",
  heroButtonText: "COMPRAR AGORA",
  featuredTitle: "Destaques da Semana",
  supportEmail: "suporte@evita.ao",
  ads: [
    { id: 1, image: "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800", link: "#" },
    { id: 2, image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=800", link: "#" }
  ]
};