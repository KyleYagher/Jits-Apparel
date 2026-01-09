import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { JitsLogo } from './JitsLogo';
import { CarouselItem } from '../services/api';

interface CarouselSlide {
  title: string;
  description: string;
  buttonText: string;
  gradientStyle: string;
  linkUrl?: string;
  imageUrl?: string;
}

const defaultSlides: CarouselSlide[] = [
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

// Map gradient style names to CSS gradient strings
const mapGradientStyle = (style: string): string => {
  const gradientMap: Record<string, string> = {
    'pink-orange': 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)',
    'orange-yellow': 'linear-gradient(90deg, var(--jits-orange) 0%, var(--jits-yellow) 100%)',
    'yellow-cyan': 'linear-gradient(90deg, var(--jits-yellow) 0%, var(--jits-cyan) 100%)',
    'cyan-pink': 'linear-gradient(90deg, var(--jits-cyan) 0%, var(--jits-pink) 100%)',
  };
  return gradientMap[style] || gradientMap['pink-orange'];
};

// Map API CarouselItem to internal CarouselSlide format
const mapCarouselItemToSlide = (item: CarouselItem): CarouselSlide => ({
  title: item.title,
  description: item.description || '',
  buttonText: item.buttonText,
  gradientStyle: mapGradientStyle(item.gradientStyle),
  linkUrl: item.linkUrl,
  imageUrl: item.imageUrl,
});

interface HeroCarouselProps {
  slides?: CarouselItem[];
  onShopClick: () => void;
}

export function HeroCarousel({ slides: carouselItems, onShopClick }: HeroCarouselProps) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Use API slides if available and active, otherwise use defaults
  const slides: CarouselSlide[] =
    carouselItems && carouselItems.length > 0
      ? carouselItems
          .filter(item => item.isActive)
          .sort((a, b) => a.order - b.order)
          .map(mapCarouselItemToSlide)
      : defaultSlides;

  useEffect(() => {
    // Only auto-rotate if there are multiple slides
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const handleButtonClick = (slide: CarouselSlide) => {
    if (slide.linkUrl) {
      navigate(slide.linkUrl);
    } else {
      onShopClick();
    }
  };

  return (
    <div className="relative overflow-hidden pb-12 w-full">
      {/* Slides Container */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => (
          <div
            key={index}
            className="w-full shrink-0 relative"
            style={{ minHeight: '700px' }}
          >
            {/* Background Image with Overlay */}
            {slide.imageUrl && (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                />
                <div className="absolute inset-0 bg-black/40" />
              </>
            )}

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4">

              
              {/* Top: Title */}
              <div className="w-full max-w-4xl pt-8">
                
                {/* Only show JitsLogo when there's no background image */}
                {!slide.imageUrl && (
                  <div className="mb-8 w-fit mx-auto">
                    <JitsLogo />
                  </div>
                )}

                {/* Two-column layout */}
                <div className="flex items-center content-center justify-center gap-8 mb-36 max-w-7xl mx-auto">

                  {/* Left column */}
                  <div className="flex-1 flex flex-col justify-center text-left min-w-0 pr-4">
                    <h1
                      className="mb-4"
                      style={{
                        fontFamily: 'Yesteryear, cursive',
                        fontSize: '4rem',
                        lineHeight: '1.2',
                        background: 'linear-gradient(90deg, #ec4899 0%, #f97316 33%, #eab308 66%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        padding: '0 8px 0 16px',
                        margin: '0 -8px 0 -16px',
                        display: 'inline-block',
                        filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                      }}
                    >
                      {slide.title}
                    </h1>

                    <p className="text-xl text-white drop-shadow-md mt-2">
                      {slide.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="w-2.5 bg-white rounded-full shrink-0" style={{ height: '200px' }} />

                  {/* Right column */}
                  <div className="shrink-0 flex items-center justify-center">
                    <button
                      type='button'
                      onClick={() => handleButtonClick(slide)}
                      className="px-8 py-4 rounded-lg text-white text-lg transition-all hover:opacity-90 hover:scale-105 shadow-lg"
                      style={{ background: slide.gradientStyle }}
                    >
                      {slide.buttonText}
                    </button>
                  </div>

                </div>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Navigation Arrows - Only show if multiple slides */}
      {slides.length > 1 && (
        <>
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
        </>
      )}
    </div>
  );
}
