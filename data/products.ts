// data/products.ts
export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  discount?: number;  // Adicionado
  video?: string;     // Adicionado
}

export const products: Product[] = [
  { id: 1, name: "Smartphone Samsung Galaxy S23", price: 399990, image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&q=80", category: "Eletrônicos", discount: 15 },
  { id: 2, name: "Notebook Dell Inspiron 15", price: 450000, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80", category: "Eletrônicos" },
  { id: 3, name: "Tênis Nike Air Max", price: 120000, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80", category: "Moda", discount: 20, video: "" },
  { id: 4, name: "Relógio Inteligente", price: 85000, image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", category: "Eletrônicos" },
];