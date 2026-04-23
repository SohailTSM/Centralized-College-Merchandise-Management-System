import { useState } from 'react';
import { Link } from 'react-router-dom';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const SIZE_DATA = {
  tshirt: {
    label: 'T-Shirt',
    emoji: '👕',
    sizes: {
      XS: { chest_cm: 86,  shoulder_cm: 40, length_cm: 66 },
      S:  { chest_cm: 91,  shoulder_cm: 42, length_cm: 68 },
      M:  { chest_cm: 96,  shoulder_cm: 44, length_cm: 70 },
      L:  { chest_cm: 101, shoulder_cm: 46, length_cm: 72 },
      XL: { chest_cm: 106, shoulder_cm: 48, length_cm: 74 },
      XXL:{ chest_cm: 116, shoulder_cm: 50, length_cm: 76 },
    },
  },
  hoodie: {
    label: 'Hoodie',
    emoji: '🧥',
    sizes: {
      XS: { chest_cm: 90,  shoulder_cm: 42, length_cm: 65 },
      S:  { chest_cm: 96,  shoulder_cm: 44, length_cm: 67 },
      M:  { chest_cm: 102, shoulder_cm: 46, length_cm: 69 },
      L:  { chest_cm: 108, shoulder_cm: 48, length_cm: 71 },
      XL: { chest_cm: 114, shoulder_cm: 50, length_cm: 73 },
      XXL:{ chest_cm: 122, shoulder_cm: 53, length_cm: 76 },
    },
  },
};

const cmToInch = (cm) => (cm / 2.54).toFixed(1);

const SizeChartPage = () => {
  const [unit, setUnit] = useState('cm');

  const fmt = (cm) => unit === 'cm' ? `${cm} cm` : `${cmToInch(cm)}"`;

  return (
    <div className="page" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">📏 Size Chart</h1>
        <p className="page-subtitle">Find your perfect fit — measurements are body measurements</p>
      </div>

      {/* Unit toggle */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['cm', 'inches'].map((u) => (
          <button key={u} className={`filter-chip${unit === u ? ' active' : ''}`} onClick={() => setUnit(u)}>
            {u === 'cm' ? '📐 Centimeters' : '📏 Inches'}
          </button>
        ))}
      </div>

      {/* How to measure */}
      <div className="card" style={{ marginBottom: '2rem', background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
        <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>📌 How to Measure</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            ['Chest', 'Measure around the fullest part of your chest, keeping the tape horizontal.'],
            ['Shoulder', 'Measure from shoulder point to shoulder point across the back.'],
            ['Length', 'Measure from the highest point of the shoulder down to the hem.'],
          ].map(([k, v]) => (
            <div key={k} style={{ padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)' }}>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.25rem' }}>{k}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Size tables */}
      {Object.entries(SIZE_DATA).map(([key, type]) => (
        <div key={key} style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>{type.emoji} {type.label} Sizes</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Chest ({unit})</th>
                  <th>Shoulder ({unit})</th>
                  <th>Length ({unit})</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((size) => {
                  const row = type.sizes[size];
                  return (
                    <tr key={size}>
                      <td><span className="badge badge-primary" style={{ fontSize: '0.85rem' }}>{size}</span></td>
                      <td>{fmt(row.chest_cm)}</td>
                      <td>{fmt(row.shoulder_cm)}</td>
                      <td>{fmt(row.length_cm)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
        All measurements are approximate. If you're between sizes, we recommend sizing up.{' '}
        <Link to="/profile" style={{ color: 'var(--primary-light)' }}>Save your size preference →</Link>
      </p>
    </div>
  );
};

export default SizeChartPage;
