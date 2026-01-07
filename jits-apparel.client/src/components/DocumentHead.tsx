import { useEffect } from 'react';
import { useTheme } from '../../context/useTheme';

export function DocumentHead() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Update meta theme-color based on current theme
    const themeColor = resolvedTheme === 'dark' ? '#0a0a0a' : '#ffffff';
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.setAttribute('name', 'theme-color');
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.setAttribute('content', themeColor);
  }, [resolvedTheme]);

  useEffect(() => {
    // Set document title
    document.title = 'Jits - Super Cool T-Shirts | South African Urban Fashion';

    // Add meta tags
    const setMetaTag = (name: string, content: string, property?: boolean) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Description
    setMetaTag('description', 'Jits - Super cool, fancy, and funky t-shirts inspired by South African urban culture. Premium quality, unique designs, free nationwide shipping.');

    // Open Graph
    setMetaTag('og:title', 'Jits - Super Cool T-Shirts', true);
    setMetaTag('og:description', 'South African urban culture meets premium t-shirt design. Express yourself with Jits.', true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'Jits', true);

    // Twitter
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', 'Jits - Super Cool T-Shirts');
    setMetaTag('twitter:description', 'South African urban culture meets premium t-shirt design.');

    // Favicon
    let favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.setAttribute('rel', 'icon');
      document.head.appendChild(favicon);
    }
    favicon.setAttribute('href', '/favicon.svg');
    favicon.setAttribute('type', 'image/svg+xml');

    // Apple touch icon
    let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (!appleTouchIcon) {
      appleTouchIcon = document.createElement('link');
      appleTouchIcon.setAttribute('rel', 'apple-touch-icon');
      document.head.appendChild(appleTouchIcon);
    }
    appleTouchIcon.setAttribute('href', '/favicon.svg');

    // Manifest
    let manifest = document.querySelector('link[rel="manifest"]');
    if (!manifest) {
      manifest = document.createElement('link');
      manifest.setAttribute('rel', 'manifest');
      document.head.appendChild(manifest);
    }
    manifest.setAttribute('href', '/manifest.json');

    // Google Fonts - Yesteryear
    const googleFonts = document.querySelector('link[href*="fonts.googleapis.com"]');
    if (!googleFonts) {
      const preconnect1 = document.createElement('link');
      preconnect1.rel = 'preconnect';
      preconnect1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(preconnect1);

      const preconnect2 = document.createElement('link');
      preconnect2.rel = 'preconnect';
      preconnect2.href = 'https://fonts.gstatic.com';
      preconnect2.crossOrigin = 'anonymous';
      document.head.appendChild(preconnect2);

      const fontLink = document.createElement('link');
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Yesteryear&display=swap';
      fontLink.rel = 'stylesheet';
      document.head.appendChild(fontLink);
    }
  }, []);

  return null;
}
