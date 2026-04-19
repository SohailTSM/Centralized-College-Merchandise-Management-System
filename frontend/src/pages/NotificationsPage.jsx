import { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';

const NotificationsPage = () => {
  const { success, error, ToastContainer } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      // Sort newest first
      setNotifications(data.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch {
      error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    } catch { /* silent */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      success('All notifications marked as read');
    } catch { error('Failed'); }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  const typeEmoji = (type) => ({
    order_processing: '✅',
    order_delivered:  '📦',
    delivery_update:  '📍',
    general:          '📢',
  }[type] || '🔔');

  return (
    <div className="page">
      <ToastContainer />
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h1 className="page-title">🔔 Notifications</h1>
          <p className="page-subtitle">{unread} unread</p>
        </div>
        {unread > 0 && (
          <button id="mark-all-read-btn" className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark all read</button>
        )}
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <h3>All caught up!</h3>
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="flex-col">
          {notifications.map((n) => (
            <div key={n._id} className={`notif-item${!n.isRead ? ' unread' : ''}`}
              onClick={() => !n.isRead && markRead(n._id)}>
              <div className="flex-gap">
                {!n.isRead && <span className="notif-unread-dot" />}
                <span style={{ fontSize: '1.25rem' }}>{typeEmoji(n.type)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.875rem' }}>{n.message}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
