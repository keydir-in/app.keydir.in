/**
 * Generated SVG avatar/identicon derived deterministically from a username
 * hash. Produces a symmetric 5x5 pixel grid with a hue unique to each user.
 * Exports: Identicon
 */

function hashUsername(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const ch = username.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return Math.abs(hash);
}

function generateGrid(username: string): boolean[][] {
  const h = hashUsername(username);
  const grid: boolean[][] = [];
  for (let y = 0; y < 5; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < 3; x++) {
      const bit = (h >> (y * 3 + x)) & 1;
      row.push(bit === 1);
    }
    grid.push([row[0], row[1], row[2], row[1], row[0]]);
  }
  return grid;
}

function hueFromUsername(username: string): number {
  const h = hashUsername(username);
  return h % 360;
}

interface IdenticonProps {
  username: string;
  size?: number;
  className?: string;
  memberNumber?: number;
}

export function Identicon({ username, size = 160, className, memberNumber }: IdenticonProps) {
  const grid = generateGrid(username);
  const hue = hueFromUsername(username);
  const cell = size / 5;

  return (
    <div className={`profile-identicon ${className || ''}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width={size} height={size} fill={`hsl(${hue}, 60%, 12%)`} />
        {grid.map((row, y) =>
          row.map((filled, x) =>
            filled ? (
              <rect
                key={`${x}-${y}`}
                x={x * cell}
                y={y * cell}
                width={cell}
                height={cell}
                fill={`hsl(${hue}, 70%, 55%)`}
              />
            ) : null
          )
        )}
      </svg>
      {memberNumber != null && (
        <div className="profile-identicon-tag">
          MEMBER #{memberNumber}
        </div>
      )}
    </div>
  );
}
