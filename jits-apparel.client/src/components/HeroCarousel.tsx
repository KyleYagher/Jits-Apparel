import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JitsLogo } from './JitsLogo';

interface CarouselSlide {
  title: string;
  description: string;
  buttonText: string;
  gradientStyle: string;
}

const slides: CarouselSlide[] = [
    {
        title: 'Jas T-shirts. Jus the way we like it!',
        description: 'Premium jus South African t-shirts.',
        buttonText: 'Shop Now',
        gradientStyle: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)',
    },
    {
        title: 'Fresh Drops. Straight from the ZA streets.',
        description: 'New dope designs.',
        buttonText: 'Explore New Arrivals',
        gradientStyle: 'linear-gradient(90deg, var(--jits-orange) 0%, var(--jits-yellow) 100%)',
    },
    {
        title: 'Limited Runs. Cant Gets.',
        description: 'Exclusive jus South African styles.',
        buttonText: 'Shop Limited Edition',
        gradientStyle: 'linear-gradient(90deg, var(--jits-yellow) 0%, var(--jits-cyan) 100%)',
    },      
];

interface HeroCarouselProps {
  onShopClick: () => void;
}

export function HeroCarousel({ onShopClick }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative overflow-hidden pb-12">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full shrink-0"
          >
            <div className="max-w-6xl mx-auto text-center">
              <div className="mb-8 w-fit mx-auto">
                <JitsLogo />
              </div>
              <h1 className="mb-2" style={{ fontFamily: 'Yesteryear, cursive', fontSize: '3rem' }}>
                {slide.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
                {slide.description}
              </p>
              <button
                onClick={onShopClick}
                className="px-8 py-4 rounded-lg text-white text-lg transition-all hover:opacity-90 hover:scale-105"
                style={{ background: slide.gradientStyle }}
              >
                {slide.buttonText}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 hover:bg-background z-10"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-6 h-6" style={{ color: 'var(--jits-orange)' }} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center transition-all hover:scale-110 hover:bg-background z-10"
        aria-label="Next slide"
      >
        <ChevronRight className="w-6 h-6" style={{ color: 'var(--jits-orange)' }} />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            type='button'
            key={index}
            onClick={() => goToSlide(index)}
            className="w-3 h-3 rounded-full transition-all"
            style={{
              backgroundColor: currentSlide === index ? 'var(--jits-pink)' : 'var(--jits-pink)',
              opacity: currentSlide === index ? 1 : 0.4,
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
