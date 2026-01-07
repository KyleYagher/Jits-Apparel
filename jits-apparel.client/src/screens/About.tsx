import { useNavigate } from 'react-router-dom';

export default function AboutScreen() {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="mb-8 text-center" style={{ fontFamily: 'Yesteryear, cursive', fontSize: '3rem' }}>
          About Jits
        </h1>
        <div className="space-y-6 text-lg">
          <p>
            <strong>Jits</strong> is more than just a t-shirt brand — it's a celebration of 
            South African urban culture. Born from the vibrant streets and creative energy 
            of SA's youth, Jits represents what's super cool, fancy, and funky.
          </p>
          <p>
            Our designs blend contemporary street style with traditional South African 
            aesthetics, creating unique pieces that tell a story. Each t-shirt is crafted 
            with premium materials and printed locally to support our community.
          </p>
          <p>
            We believe fashion should be accessible, expressive, and authentic. That's 
            why every Jits piece is designed to make you feel confident and connected 
            to the culture that inspires us.
          </p>
          <div className="pt-8 text-center">
            <button
              type='button'
              onClick={() => navigate('/shop')}
              className="px-8 py-4 rounded-lg text-white transition-all hover:opacity-90"
              style={{ 
                background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
              }}
            >
              Explore Collection
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}