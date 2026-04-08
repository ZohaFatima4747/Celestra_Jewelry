// Maps product image filenames (stored in DB) to their Vite-bundled asset URLs.
// Add new filenames here as products are added.

import earrings3set from '../assets/3 earrings set.jpeg';
import earrings3set2 from '../assets/3 earrings set2.jpeg';
import ayatulkursi from '../assets/Ayat-ul-kursi pendant .jpeg';
import beadedHandcuff from '../assets/Beaded style handcuff .jpeg';
import blackTriangle from '../assets/Black triangle .jpeg';
import bowSet from '../assets/Bow set with unique chain .jpeg';
import butterflySet from '../assets/Butterfly set .jpeg';
import cageHandcuff from '../assets/Cage style handcuff.jpeg';
import cartierNailHandcuff from '../assets/Cartier nail style handcuff with ring .jpeg';
import cartierHandcuff from '../assets/Cartier style handcuff with ring .jpeg';
import cartierBracelet from '../assets/Cartier style bracelet .jpeg';
import coloredStone from '../assets/Colored stone chains.jpeg';
import doubleChainHarness from '../assets/Double chain hand harness.jpeg';
import emeraldRing from '../assets/Emerald green stone ring.jpeg';
import emeraldAlternate from '../assets/Emeraldgreen alternate stone .jpeg';
import handHarness from '../assets/Hand harnes .jpeg';
import silverChainSet from '../assets/Silver chain & earrings set.jpeg';
import singleGoldenChains from '../assets/Single golden chains.jpeg';
import singleSilverChains from '../assets/Single silver chains.jpeg';
import singleTwistedBracelet from '../assets/Single twisted bracelet unisex.jpeg';
import spiralRing from '../assets/Spiral ring.jpeg';
import starMoonRing from '../assets/Star moon ring.jpeg';
import starfishSeashell from '../assets/Starfish& seashell chain .jpeg';
import sunEarrings from '../assets/Sun style earrings .jpeg';
import symbolForeverRing from '../assets/Symbol of forever ring.jpeg';
import tripleChainBracelet from '../assets/Triple chain bracelet .jpeg';
import tripleHeartChain from '../assets/Triple heart chain.jpeg';
import whiteStoneHandcuff from '../assets/White stone handcuff .jpeg';
import seashellChain from '../assets/Seashell chain.jpeg';
import yinYanRing from '../assets/Yin Yan ring.jpeg';

const assetMap = {
  '3 earrings set.jpeg': earrings3set,
  '3 earrings set2.jpeg': earrings3set2,
  'Ayat-ul-kursi pendant .jpeg': ayatulkursi,
  'Beaded style handcuff .jpeg': beadedHandcuff,
  'Black triangle .jpeg': blackTriangle,
  'Bow set with unique chain .jpeg': bowSet,
  'Butterfly set .jpeg': butterflySet,
  'Cage style handcuff.jpeg': cageHandcuff,
  'Cartier nail style handcuff with ring .jpeg': cartierNailHandcuff,
  'Cartier style handcuff with ring .jpeg': cartierHandcuff,
  'Cartier style bracelet .jpeg': cartierBracelet,
  'Colored stone chains.jpeg': coloredStone,
  'Double chain hand harness.jpeg': doubleChainHarness,
  'Emerald green stone ring.jpeg': emeraldRing,
  'Emeraldgreen alternate stone .jpeg': emeraldAlternate,
  'Hand harnes .jpeg': handHarness,
  'Silver chain & earrings set.jpeg': silverChainSet,
  'Single golden chains.jpeg': singleGoldenChains,
  'Single silver chains.jpeg': singleSilverChains,
  'Single twisted bracelet unisex.jpeg': singleTwistedBracelet,
  'Spiral ring.jpeg': spiralRing,
  'Star moon ring.jpeg': starMoonRing,
  'Starfish& seashell chain .jpeg': starfishSeashell,
  'Sun style earrings .jpeg': sunEarrings,
  'Symbol of forever ring.jpeg': symbolForeverRing,
  'Triple chain bracelet .jpeg': tripleChainBracelet,
  'Triple heart chain.jpeg': tripleHeartChain,
  'White stone handcuff .jpeg': whiteStoneHandcuff,
  'Seashell chain.jpeg': seashellChain,
  'Yin Yan ring.jpeg': yinYanRing,
};

/**
 * Resolves a product image to a displayable URL.
 *
 * Priority:
 *  1. Full URL (http/https) → used as-is
 *  2. Server path (/uploads/...) → prepend API base URL, swap variant suffix
 *  3. Legacy bundled filename → look up in static assetMap
 *  4. Fallback → empty string
 *
 * @param {string} filename
 * @param {'thumb'|'md'|'full'} [size='full']
 */
export function resolveImage(filename, size = 'full') {
  if (!filename) return '';

  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;

  if (filename.startsWith('/uploads/') || filename.startsWith('/assets/')) {
    const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1000';
    // New uploads: /uploads/<base>-full.webp — swap suffix for requested size
    if (filename.endsWith('-full.webp') && size !== 'full') {
      return `${base}${filename.replace(/-full\.webp$/, `-${size}.webp`)}`;
    }
    return `${base}${filename}`;
  }

  return assetMap[filename] || '';
}

/**
 * Returns src + srcSet + sizes for responsive <img> rendering.
 * New uploads get a 3-stop srcSet (400w / 800w / 1200w).
 * Legacy assets fall back to a single src.
 *
 * @param {string} filename
 * @returns {{ src: string, srcSet: string|undefined, sizes: string|undefined }}
 */
export function resolveImageSrcSet(filename) {
  const full  = resolveImage(filename, 'full');
  const isNewUpload = Boolean(
    filename &&
    (filename.startsWith('/uploads/') || filename.startsWith('http')) &&
    filename.endsWith('-full.webp')
  );

  if (!isNewUpload) return { src: full, srcSet: undefined, sizes: undefined };

  const md    = resolveImage(filename, 'md');
  const thumb = resolveImage(filename, 'thumb');

  return {
    src:    full,
    srcSet: `${thumb} 400w, ${md} 800w, ${full} 1200w`,
    sizes:  '(max-width: 480px) 200px, (max-width: 900px) 400px, 600px',
  };
}

export default assetMap;
