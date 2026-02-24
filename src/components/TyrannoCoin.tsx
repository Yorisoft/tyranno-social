interface TyrannoCoinProps {
  className?: string;
}

export function TyrannoCoin({ className = "h-8 w-8" }: TyrannoCoinProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer gold ring */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="url(#goldGradient)"
        stroke="url(#goldRim)"
        strokeWidth="2"
      />
      
      {/* Inner shadow ring */}
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1"
      />
      
      {/* Red inner circle */}
      <circle
        cx="50"
        cy="50"
        r="42"
        fill="url(#redGradient)"
      />
      
      {/* Inner gold border */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="url(#innerGold)"
        strokeWidth="2"
      />
      
      {/* Dark center background */}
      <circle
        cx="50"
        cy="50"
        r="36"
        fill="url(#darkGradient)"
      />
      
      {/* T-Rex silhouette - simplified iconic pose */}
      <g transform="translate(50, 50)">
        {/* Head */}
        <path
          d="M 8 -18 L 18 -16 L 20 -12 L 18 -8 L 10 -10 L 8 -18 Z"
          fill="url(#dinoGradient)"
          stroke="rgba(255,215,0,0.5)"
          strokeWidth="0.5"
        />
        
        {/* Eye */}
        <circle cx="15" cy="-13" r="1.5" fill="#FFD700" />
        
        {/* Jaw */}
        <path
          d="M 18 -12 L 24 -10 L 24 -6 L 20 -8 L 18 -8 Z"
          fill="url(#dinoGradient)"
          stroke="rgba(255,215,0,0.5)"
          strokeWidth="0.5"
        />
        
        {/* Neck */}
        <path
          d="M 10 -10 L 8 -5 L 4 0 L 8 0 L 10 -10 Z"
          fill="url(#dinoGradient)"
          stroke="rgba(255,215,0,0.5)"
          strokeWidth="0.5"
        />
        
        {/* Body */}
        <ellipse
          cx="-2"
          cy="2"
          rx="10"
          ry="8"
          fill="url(#dinoGradient)"
          stroke="rgba(255,215,0,0.5)"
          strokeWidth="0.5"
        />
        
        {/* Tail - curved */}
        <path
          d="M -10 0 Q -18 -2 -22 -8"
          stroke="url(#dinoGradient)"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Tail tip */}
        <circle cx="-22" cy="-8" r="2" fill="url(#dinoGradient)" />
        
        {/* Front arm (small) */}
        <path
          d="M 4 0 L 6 4 L 5 6"
          stroke="url(#dinoGradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Back leg */}
        <path
          d="M -6 8 L -8 16 L -10 18 M -8 16 L -6 18"
          stroke="url(#dinoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Front leg */}
        <path
          d="M 2 8 L 2 18 L 0 20 M 2 18 L 4 20"
          stroke="url(#dinoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* Shine effect */}
      <circle
        cx="35"
        cy="35"
        r="8"
        fill="white"
        opacity="0.2"
      />
      
      {/* Definitions */}
      <defs>
        {/* Gold gradient for outer ring */}
        <radialGradient id="goldGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </radialGradient>
        
        {/* Gold rim gradient */}
        <linearGradient id="goldRim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFED4E" />
          <stop offset="50%" stopColor="#FFD700" />
          <stop offset="100%" stopColor="#DAA520" />
        </linearGradient>
        
        {/* Red gradient for middle ring */}
        <radialGradient id="redGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#FF4444" />
          <stop offset="50%" stopColor="#CC0000" />
          <stop offset="100%" stopColor="#990000" />
        </radialGradient>
        
        {/* Inner gold border */}
        <linearGradient id="innerGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
        
        {/* Dark center gradient */}
        <radialGradient id="darkGradient" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </radialGradient>
        
        {/* Dinosaur gradient */}
        <linearGradient id="dinoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD700" />
          <stop offset="50%" stopColor="#FFA500" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
    </svg>
  );
}
