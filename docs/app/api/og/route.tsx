import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

// Status color mapping
const statusColors: Record<string, { bg: string; text: string }> = {
  Final: { bg: '#22c55e20', text: '#22c55e' },
  Draft: { bg: '#eab30820', text: '#eab308' },
  Review: { bg: '#3b82f620', text: '#3b82f6' },
  'Last Call': { bg: '#a855f720', text: '#a855f7' },
  Withdrawn: { bg: '#ef444420', text: '#ef4444' },
  Stagnant: { bg: '#6b728020', text: '#6b7280' },
};

// Category icons/colors
const categoryColors: Record<string, string> = {
  Core: '#f97316',
  Networking: '#06b6d4',
  Interface: '#8b5cf6',
  LRC: '#ec4899',
  Bridge: '#14b8a6',
  Meta: '#6366f1',
  Informational: '#64748b',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const lp = searchParams.get('lp') || '0';
  const title = searchParams.get('title') || 'Lux Proposal';
  const description = searchParams.get('description') || '';
  const status = searchParams.get('status') || 'Draft';
  const category = searchParams.get('category') || 'Core';
  const type = searchParams.get('type') || 'Standards Track';

  const statusColor = statusColors[status] || statusColors.Draft;
  const categoryColor = categoryColors[category] || categoryColors.Core;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0a0a',
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header with LP number and status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '40px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Lux Logo placeholder - gradient circle */}
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>L</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#a1a1aa', fontSize: '18px' }}>Lux Proposal</span>
              <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
                LP-{lp}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                backgroundColor: statusColor.bg,
                color: statusColor.text,
                padding: '8px 20px',
                borderRadius: '9999px',
                fontSize: '18px',
                fontWeight: '600',
              }}
            >
              {status}
            </span>
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <h1
            style={{
              color: 'white',
              fontSize: title.length > 60 ? '42px' : title.length > 40 ? '52px' : '64px',
              fontWeight: 'bold',
              lineHeight: 1.2,
              marginBottom: '24px',
              maxWidth: '900px',
            }}
          >
            {title}
          </h1>

          {description && (
            <p
              style={{
                color: '#a1a1aa',
                fontSize: '24px',
                lineHeight: 1.5,
                maxWidth: '800px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {description.length > 150 ? description.substring(0, 150) + '...' : description}
            </p>
          )}
        </div>

        {/* Footer with category and type */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: '40px',
            paddingTop: '30px',
            borderTop: '1px solid #27272a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Category indicator */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: categoryColor,
                }}
              />
              <span style={{ color: '#a1a1aa', fontSize: '18px' }}>{category}</span>
            </div>

            <span style={{ color: '#52525b' }}>•</span>

            <span style={{ color: '#a1a1aa', fontSize: '18px' }}>{type}</span>
          </div>

          <span style={{ color: '#52525b', fontSize: '18px' }}>lps.lux.network</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
