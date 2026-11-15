import React from 'react';

interface Babu22LogoProps {
  className?: string;
  size?: number | string;
}

export const Babu22Logo: React.FC<Babu22LogoProps> = ({ className = 'w-10 h-10', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        {/* Background Vignette */}
        <radialGradient id="babuBgGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#141a29" />
          <stop offset="70%" stopColor="#070a12" />
          <stop offset="100%" stopColor="#020408" />
        </radialGradient>

        {/* Metallic Gold Gradients */}
        <linearGradient id="babuGoldRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe27a" />
          <stop offset="25%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#996515" />
          <stop offset="75%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#aa771c" />
        </linearGradient>

        <linearGradient id="babuGoldTextGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fffbe8" />
          <stop offset="30%" stopColor="#fde047" />
          <stop offset="60%" stopColor="#ca8a04" />
          <stop offset="90%" stopColor="#854d0e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>

        {/* Red 22 Gradient */}
        <linearGradient id="babuRedGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="20%" stopColor="#ef4444" />
          <stop offset="60%" stopColor="#b91c1c" />
          <stop offset="90%" stopColor="#7f1d1d" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>

        {/* Ruby Gem Gradient */}
        <linearGradient id="babuRubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>

        {/* Drop Shadows */}
        <filter id="babuShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.85" />
        </filter>
      </defs>

      {/* Circular Outer Background */}
      <circle
        cx="250"
        cy="250"
        r="230"
        fill="url(#babuBgGrad)"
        stroke="url(#babuGoldRing)"
        strokeWidth="8"
        filter="url(#babuShadow)"
      />
      <circle cx="250" cy="250" r="215" fill="none" stroke="#ca8a04" strokeWidth="2" opacity="0.6" />
      <circle cx="250" cy="250" r="205" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />

      {/* Left Poker Chip */}
      <g transform="translate(60, 150) rotate(-20)" filter="url(#babuShadow)">
        <circle cx="40" cy="40" r="38" fill="#18181b" stroke="url(#babuGoldRing)" strokeWidth="3" />
        <circle cx="40" cy="40" r="32" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="14 10" />
        <circle cx="40" cy="40" r="22" fill="#27272a" stroke="url(#babuGoldRing)" strokeWidth="1.5" />
        <path
          d="M40 25 C34 33 26 37 26 43 C26 48 31 51 36 51 C38 51 39 50 40 48 C41 50 42 51 44 51 C49 51 54 48 54 43 C54 37 46 33 40 25 Z"
          fill="url(#babuGoldRing)"
        />
        <path d="M37 49 L43 49 L41 55 L39 55 Z" fill="url(#babuGoldRing)" />
      </g>

      {/* Right Poker Chip */}
      <g transform="translate(380, 310) rotate(25)" filter="url(#babuShadow)">
        <circle cx="40" cy="40" r="38" fill="#18181b" stroke="url(#babuGoldRing)" strokeWidth="3" />
        <circle cx="40" cy="40" r="32" fill="none" stroke="#dc2626" strokeWidth="4" strokeDasharray="14 10" />
        <circle cx="40" cy="40" r="22" fill="#27272a" stroke="url(#babuGoldRing)" strokeWidth="1.5" />
        <path
          d="M40 25 C34 33 26 37 26 43 C26 48 31 51 36 51 C38 51 39 50 40 48 C41 50 42 51 44 51 C49 51 54 48 54 43 C54 37 46 33 40 25 Z"
          fill="url(#babuGoldRing)"
        />
        <path d="M37 49 L43 49 L41 55 L39 55 Z" fill="url(#babuGoldRing)" />
      </g>

      {/* Four Aces Fan */}
      <g id="acesFan" filter="url(#babuShadow)">
        {/* Ace 1: Spades */}
        <g transform="translate(260, 60) rotate(-18)">
          <rect x="0" y="0" width="60" height="95" rx="6" fill="#fffef0" stroke="#ca8a04" strokeWidth="2" />
          <text x="8" y="20" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#18181b">
            A
          </text>
          <text x="8" y="34" fontSize="13" fill="#18181b">
            ♠
          </text>
          <path
            d="M30 45 C25 51 18 55 18 61 C18 66 22 69 27 69 C28 69 29 68 30 66 C31 68 32 69 33 69 C38 69 42 66 42 61 C42 55 35 51 30 45 Z"
            fill="#18181b"
          />
          <path d="M28 67 L32 67 L31 72 L29 72 Z" fill="#18181b" />
        </g>

        {/* Ace 2: Hearts */}
        <g transform="translate(300, 68) rotate(-6)">
          <rect x="0" y="0" width="60" height="95" rx="6" fill="#fffef0" stroke="#ca8a04" strokeWidth="2" />
          <text x="8" y="20" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#dc2626">
            A
          </text>
          <text x="8" y="34" fontSize="13" fill="#dc2626">
            ♥
          </text>
          <path
            d="M30 52 C30 52 23 44 19 48 C15 52 17 59 21 63 L30 72 L39 63 C43 59 45 52 41 48 C37 44 30 52 30 52 Z"
            fill="#dc2626"
          />
        </g>

        {/* Ace 3: Clubs */}
        <g transform="translate(345, 85) rotate(8)">
          <rect x="0" y="0" width="60" height="95" rx="6" fill="#fffef0" stroke="#ca8a04" strokeWidth="2" />
          <text x="8" y="20" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#18181b">
            A
          </text>
          <text x="8" y="34" fontSize="13" fill="#18181b">
            ♣
          </text>
          <circle cx="30" cy="52" r="6" fill="#18181b" />
          <circle cx="24" cy="60" r="6" fill="#18181b" />
          <circle cx="36" cy="60" r="6" fill="#18181b" />
          <path d="M28 62 L32 62 L33 71 L27 71 Z" fill="#18181b" />
        </g>

        {/* Ace 4: Diamonds */}
        <g transform="translate(390, 115) rotate(22)">
          <rect x="0" y="0" width="60" height="95" rx="6" fill="#fffef0" stroke="#ca8a04" strokeWidth="2" />
          <text x="8" y="20" fontFamily="'Outfit', sans-serif" fontWeight="900" fontSize="16" fill="#dc2626">
            A
          </text>
          <text x="8" y="34" fontSize="13" fill="#dc2626">
            ♦
          </text>
          <polygon points="30,46 39,58 30,70 21,58" fill="#dc2626" />
        </g>
      </g>

      {/* Royal Crown */}
      <g id="crown" transform="translate(130, 85)" filter="url(#babuShadow)">
        <path d="M15 90 Q75 100 135 90 L132 82 Q75 92 18 82 Z" fill="url(#babuGoldRing)" stroke="#78350f" strokeWidth="1.5" />
        <path d="M15 85 L2 35 L40 55 L75 15 L110 55 L148 35 L135 85 Q75 96 15 85 Z" fill="url(#babuGoldRing)" stroke="#92400e" strokeWidth="2" />
        <path d="M25 80 L18 45 L42 60 L75 28 L108 60 L132 45 L125 80 Q75 88 25 80 Z" fill="url(#babuGoldTextGrad)" opacity="0.8" />
        <circle cx="2" cy="35" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="75" cy="15" r="7" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
        <circle cx="148" cy="35" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="40" cy="55" r="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="110" cy="55" r="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
        <polygon points="75,45 83,55 75,65 67,55" fill="url(#babuRubyGrad)" stroke="#450a0a" strokeWidth="1" />
        <circle cx="45" cy="74" r="5" fill="url(#babuRubyGrad)" stroke="#450a0a" strokeWidth="1" />
        <circle cx="105" cy="74" r="5" fill="url(#babuRubyGrad)" stroke="#450a0a" strokeWidth="1" />
        <circle cx="75" cy="77" r="4" fill="#67e8f9" stroke="#0e7490" strokeWidth="1" />
      </g>

      {/* "Babu" 3D Script */}
      <g id="babuText" filter="url(#babuShadow)">
        <text x="45" y="278" fontFamily="'Brush Script MT', 'Outfit', cursive, serif" fontWeight="900" fontSize="142" fontStyle="italic" fill="#3f2202">
          Babu
        </text>
        <text x="43" y="275" fontFamily="'Brush Script MT', 'Outfit', cursive, serif" fontWeight="900" fontSize="142" fontStyle="italic" fill="#78350f">
          Babu
        </text>
        <text x="41" y="272" fontFamily="'Brush Script MT', 'Outfit', cursive, serif" fontWeight="900" fontSize="142" fontStyle="italic" fill="#ca8a04">
          Babu
        </text>
        <text
          x="40"
          y="270"
          fontFamily="'Brush Script MT', 'Outfit', cursive, serif"
          fontWeight="900"
          fontSize="142"
          fontStyle="italic"
          fill="url(#babuGoldTextGrad)"
          stroke="#ffffff"
          strokeWidth="2.5"
          paintOrder="stroke fill"
        >
          Babu
        </text>
      </g>

      {/* "22" 3D Red with Gold Border */}
      <g id="num22Text" filter="url(#babuShadow)">
        <text x="315" y="278" fontFamily="'Outfit', 'Impact', sans-serif" fontWeight="900" fontSize="130" fontStyle="italic" fill="#2d0606">
          22
        </text>
        <text x="312" y="275" fontFamily="'Outfit', 'Impact', sans-serif" fontWeight="900" fontSize="130" fontStyle="italic" fill="#580e0e">
          22
        </text>
        <text x="309" y="272" fontFamily="'Outfit', 'Impact', sans-serif" fontWeight="900" fontSize="130" fontStyle="italic" fill="#991b1b">
          22
        </text>
        <text
          x="306"
          y="268"
          fontFamily="'Outfit', 'Impact', sans-serif"
          fontWeight="900"
          fontSize="130"
          fontStyle="italic"
          fill="url(#babuRedGrad)"
          stroke="url(#babuGoldRing)"
          strokeWidth="4.5"
          paintOrder="stroke fill"
        >
          22
        </text>
      </g>

      {/* "BETTING" Banner */}
      <g id="bannerRibbon" filter="url(#babuShadow)">
        <path d="M60 360 C140 330 360 330 440 360 L425 405 C350 380 150 380 75 405 Z" fill="#0b0f19" stroke="url(#babuGoldRing)" strokeWidth="5" />
        <path d="M66 364 C144 336 356 336 434 364 L422 400 C348 376 152 376 78 400 Z" fill="#18181b" stroke="#eab308" strokeWidth="1.5" />
        <path d="M55 358 L20 340 L35 375 L15 400 L65 390 Z" fill="url(#babuGoldRing)" stroke="#78350f" strokeWidth="1.5" opacity="0.9" />
        <path d="M445 358 L480 340 L465 375 L485 400 L435 390 Z" fill="url(#babuGoldRing)" stroke="#78350f" strokeWidth="1.5" opacity="0.9" />
        <line x1="90" y1="368" x2="120" y2="368" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
        <line x1="90" y1="376" x2="120" y2="376" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
        <line x1="90" y1="384" x2="120" y2="384" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
        <text
          x="250"
          y="386"
          fontFamily="'Outfit', sans-serif"
          fontWeight="900"
          fontSize="44"
          letterSpacing="6"
          textAnchor="middle"
          fill="url(#babuGoldTextGrad)"
          stroke="#451a03"
          strokeWidth="1.5"
        >
          BETTING
        </text>
        <line x1="380" y1="368" x2="410" y2="368" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
        <line x1="380" y1="376" x2="410" y2="376" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
        <line x1="380" y1="384" x2="410" y2="384" stroke="url(#babuGoldRing)" strokeWidth="4" strokeLinecap="round" />
      </g>
    </svg>
  );
};
