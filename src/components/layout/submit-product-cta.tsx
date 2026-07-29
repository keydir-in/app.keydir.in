/**
 * Call-to-action section encouraging users to submit missing products.
 * Displays product-type-specific copy with a link to the contact page.
 * Exports: SubmitProductCTA
 */

const textMap: Record<string, string[]> = {
  keyboard: [
    'Missing a keyboard?',
    'Help us improve KeyDir by submitting it to our team.',
    'We\'re constantly expanding the directory with community contributions.',
  ],
  switch: [
    'Missing a switch?',
    'Help us improve KeyDir by submitting it to our team.',
    'We\'re constantly expanding the directory with community contributions.',
  ],
  keycap: [
    'Missing a keycap?',
    'Help us improve KeyDir by submitting it to our team.',
    'We\'re constantly expanding the directory with community contributions.',
  ],
  mouse: [
    'Missing a mouse?',
    'Help us improve KeyDir by submitting it to our team.',
    'We\'re constantly expanding the directory with community contributions.',
  ],
}

export function SubmitProductCTA({ productType }: { productType: string }) {
  const lines = textMap[productType]
  if (!lines) return null

  return (
    <div className="catalog-page" style={{ paddingBottom: '80px' }}>
      <div className="cta-section" style={{ background: 'var(--cta-bg)', position: 'relative', overflow: 'hidden' }}>
        <div className="section-tag-label"><span className="dot" /> SYSTEM_ONLINE // COMMUNITY_REQUEST</div>
        <h2 style={{ fontFamily: 'var(--f-d)', fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-.05em', lineHeight: .9, marginBottom: '1.5rem' }}>
          CAN&apos;T FIND<br />YOUR PRODUCT?
        </h2>
        <p style={{ fontFamily: 'var(--f-m)', fontSize: '.9rem', maxWidth: '520px', marginBottom: '2rem', lineHeight: 1.75, color: 'var(--cta-text-muted)' }}>
          {lines.map((line, i) => (
            <span key={i}>
              {line}
              {i < lines.length - 1 && <br />}
            </span>
          ))}
        </p>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <a href="https://keydir.in/contact/" target="_blank" rel="noopener" className="btn-primary">CONTACT US →</a>
        </div>
      </div>
    </div>
  );
}
