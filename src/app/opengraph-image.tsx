import { ImageResponse } from 'next/og';

export const alt = 'KeyDir — Track Mechanical Keyboard Prices Across India';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A2E 50%, #0A0A0A 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: '#FAFAFA',
            letterSpacing: '-0.04em',
            marginBottom: 16,
          }}
        >
          KeyDir
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#A0A0A0',
            fontWeight: 400,
            textAlign: 'center',
            maxWidth: 600,
          }}
        >
          Track Mechanical Keyboard Prices Across India
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
