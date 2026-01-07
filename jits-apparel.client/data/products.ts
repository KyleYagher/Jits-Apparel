import { Product } from '../types';

export const products: Product[] = [
  {
    id: '1',
    name: 'Jits Signature Black',
    price: 450,
    description: 'Premium black tee with the iconic Jits gradient logo. Super cool and versatile for any occasion.',
    image: 'https://images.unsplash.com/photo-1657364890927-5dd04b231a6d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxibGFjayUyMHQtc2hpcnQlMjBtb2NrdXB8ZW58MXx8fHwxNzY0NzE0OTk1fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Signature',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Charcoal'],
    featured: true
  },
  {
    id: '2',
    name: 'Jits White Classic',
    price: 420,
    description: 'Clean white tee featuring the Jits logo in full gradient glory. A timeless piece for the culture.',
    image: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMHQtc2hpcnQlMjBtb2NrdXB8ZW58MXx8fHwxNzY0NzU1NjQ4fDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Classic',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['White', 'Cream'],
    featured: true
  },
  {
    id: '3',
    name: 'Urban Gradient Edition',
    price: 520,
    description: 'Bold gradient design inspired by South African street culture. Maximum funky vibes.',
    image: 'https://images.unsplash.com/photo-1763550379507-ea4da16ab274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xvcmZ1bCUyMHQtc2hpcnQlMjBkZXNpZ258ZW58MXx8fHwxNzY0Nzc4NTUxfDA&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Limited',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Multi', 'Pink'],
    featured: true
  },
  {
    id: '4',
    name: 'Streetwear Essential',
    price: 480,
    description: 'Elevated streetwear with the Jits touch. Perfect for those who know what\'s cool.',
    image: 'https://images.unsplash.com/photo-1635650805015-2fa50682873a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMHN0cmVldHdlYXIlMjBmYXNoaW9ufGVufDF8fHx8MTc2NDc3ODU1MXww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Streetwear',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Black', 'Navy', 'Olive'],
    featured: false
  },
  {
    id: '5',
    name: 'Graphic Flow Tee',
    price: 495,
    description: 'Dynamic graphic design that flows with your style. Super fancy and eye-catching.',
    image: 'https://images.unsplash.com/photo-1655141559787-25ac8cfca72f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFwaGljJTIwdGVlJTIwZGVzaWdufGVufDF8fHx8MTc2NDc3ODU1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Graphics',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['Black', 'White'],
    featured: false
  },
  {
    id: '6',
    name: 'Lifestyle Premium',
    price: 550,
    description: 'Premium quality for the lifestyle you deserve. Jits brings the culture to life.',
    image: 'https://images.unsplash.com/photo-1591338459467-bd36100b07c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmVuZHklMjBhcHBhcmVsJTIwbGlmZXN0eWxlfGVufDF8fHx8MTc2NDc3ODU1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
    category: 'Premium',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['Charcoal', 'Stone'],
    featured: false
  }
];
