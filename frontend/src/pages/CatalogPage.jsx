import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';

const TYPES = ['All', 'tshirt', 'hoodie', 'cap', 'mug', 'other'];

const CatalogPage = () => {
  const { user } = useAuth();
  const { error, ToastContainer } = useToast();
  const navigate = useNavigate();

  const [items,   setItems]   = useState([]);
  const [clubs,   setClubs]   = useState([]); // list of clubs for filter
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [page,    setPage]    = useState(1);
  const [type,    setType]    = useState('All');
  const [clubId,  setClubId]  = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedSizes, setSelectedSizes] = useState({});

  // Fetch catalog
  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (type !== 'All')   params.type = type;
      if (clubId !== 'All') params.clubId = clubId;
      const { data } = await api.get('/merchandise', { params });
      setItems(data.items);
      setTotal(data.total);
      setPages(data.pages);
      // Build clubs list from results
      if (clubs.length === 0) {
        const uniqueClubs = [];
        const seen = new Set();
        data.items.forEach((item) => {
          if (item.clubId && !seen.has(item.clubId._id)) {
            seen.add(item.clubId._id);
            uniqueClubs.push({ _id: item.clubId._id, name: item.clubId.name });
          }
        });
        setClubs(uniqueClubs);
      }
    } catch {
      error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  // Fetch all clubs for filter (separate call to get full list)
  const fetchClubs = async () => {
    try {
      const { data } = await api.get('/clubs');
      setClubs(data);
    } catch {/* ignore — clubs from catalog items is fallback */}
  };

  useEffect(() => { fetchClubs(); }, []);
  useEffect(() => { fetchItems(); }, [page, type, clubId]);

  const getUserPrefSize = (item) => {
    if (['mug', 'cap'].includes(item.type)) return null;
    return user?.sizeProfile?.[item.type] || user?.sizeProfile?.other || null;
  };

  const handleOrder = (item, chosenSize) => {
    if (!chosenSize) {
      return error('Please select a size first');
    }
    navigate('/payment', {
      state: {
        items: [{ merchandiseId: item._id, name: item.name, size: chosenSize, quantity: 1, price: item.price }],
        totalAmount: item.price,
      },
    });
  };

  return (
    <div className="page">
      <ToastContainer />
      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">🛍️ Merchandise Catalog</h1>
          <p className="page-subtitle">{total} items available</p>
        </div>
        <Link to="/size-chart" style={{ fontSize: '0.8rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          📏 Size Chart
        </Link>
      </div>

      {/* Club filter */}
      {clubs.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.375rem', fontWeight: 600 }}>CLUB</p>
          <div className="filter-bar">
            <button className={`filter-chip${clubId === 'All' ? ' active' : ''}`} onClick={() => { setClubId('All'); setPage(1); }}>All Clubs</button>
            {clubs.map((c) => (
              <button key={c._id} className={`filter-chip${clubId === c._id ? ' active' : ''}`} onClick={() => { setClubId(c._id); setPage(1); }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Type filter */}
      <div style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.375rem', fontWeight: 600 }}>TYPE</p>
        <div className="filter-bar">
          {TYPES.map((t) => (
            <button key={t} className={`filter-chip${type === t ? ' active' : ''}`} onClick={() => { setType(t); setPage(1); }}>
              {t === 'All' ? '✦ All' : t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>No items found</h3>
          <p>Try changing the filters or check back later.</p>
        </div>
      ) : (
        <div className="grid-3">
          {items.map((item) => {
            return (
              <div key={item._id} className="card merch-card">
                <span className="merch-type-chip">{item.type}</span>
                {item.imageUrl
                  ? <img className="card-image" src={item.imageUrl} alt={item.name} />
                  : <div className="card-image flex-center" style={{ fontSize: '3rem' }}>🎽</div>
                }
                <p className="merch-club">🏛 {item.clubId?.name || 'Club'}</p>
                <p className="merch-name">{item.name}</p>
                {item.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>{item.description}</p>}
                
                {(() => {
                  const isFixedSize = ['cap', 'mug'].includes(item.type);
                  const prefSize = getUserPrefSize(item);
                  const hasPrefSize = prefSize && item.availableSizes?.includes(prefSize);
                  const chosenSize  = selectedSizes[item._id] || (isFixedSize ? 'Standard' : (hasPrefSize ? prefSize : null));

                  return (
                    <div style={{ marginTop: 'auto', paddingTop: '0.5rem' }}>
                      {(item.availableSizes || []).length > 0 && (
                        <div className="size-buttons">
                          {item.availableSizes.map((s) => (
                            <button key={s} type="button"
                              className={`size-btn${chosenSize === s ? ' selected' : ''}`}
                              onClick={() => setSelectedSizes((p) => ({ ...p, [item._id]: s }))}>
                              {s}{(!isFixedSize && hasPrefSize && s === prefSize) ? ' ★' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                      {!isFixedSize && prefSize && !hasPrefSize && (
                        <p style={{ fontSize: '0.7rem', color: '#ef4444', marginBottom: '0.25rem', fontWeight: 500 }}>
                          ⚠️ Your size ({prefSize}) is not available
                        </p>
                      )}
                      <div className="flex-between" style={{ marginTop: '0.75rem' }}>
                        <span className="merch-price">₹{item.price}</span>
                        <button id={`order-btn-${item._id}`} className="btn btn-primary btn-sm" 
                          disabled={!chosenSize} 
                          onClick={() => handleOrder(item, chosenSize)}>
                          Order
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {pages > 1 && (
        <div className="pagination">
          <button className="pag-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>‹</button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`pag-btn${p === page ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pag-btn" disabled={page === pages} onClick={() => setPage((p) => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
