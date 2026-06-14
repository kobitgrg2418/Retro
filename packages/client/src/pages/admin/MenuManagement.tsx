import { useState, useEffect, type FormEvent } from 'react';
import { getMenu, createMenuItem, updateMenuItem, deleteMenuItem } from '../../api';
import type { MenuItem } from '../../types';

const CATEGORIES = [
  { label: 'Appetizers', value: 'appetizer' },
  { label: 'Main Course', value: 'main_course' },
  { label: 'Desserts', value: 'dessert' },
  { label: 'Beverages', value: 'beverage' },
  { label: 'Premium Beverages', value: 'premium_beverage' },
];

const CATEGORY_LABELS: Record<string, string> = {
  appetizer: 'Appetizers',
  main_course: 'Main Course',
  dessert: 'Desserts',
  beverage: 'Beverages',
  premium_beverage: 'Premium Beverages',
};

interface MenuForm {
  name: string;
  description: string;
  price: string;
  category: string;
  is_premium: boolean;
  is_available: boolean;
}

const EMPTY_FORM: MenuForm = {
  name: '',
  description: '',
  price: '',
  category: 'appetizer',
  is_premium: false,
  is_available: true,
};

export default function MenuManagement() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<MenuForm>(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadItems = () => {
    setLoading(true);
    getMenu()
      .then(data => { setItems(data); setError(''); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadItems(); }, []);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      category: item.category,
      is_premium: !!item.is_premium,
      is_available: !!item.is_available,
    });
    setEditId(item.id);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteMenuItem(id);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim() || !form.price) {
      setFormError('Name and price are required');
      return;
    }
    setFormLoading(true);
    try {
      const data: Partial<MenuItem> = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        is_premium: form.is_premium ? 1 : 0,
        is_available: form.is_available ? 1 : 0,
      };
      if (editId) {
        await updateMenuItem(editId, data);
      } else {
        await createMenuItem(data);
      }
      setShowModal(false);
      loadItems();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>;

  return (
    <div className="admin-content">
      <div className="admin-header">
        <h1 className="admin-title">Menu Management</h1>
        <button className="btn btn-primary" onClick={openAdd}>+ Add New Item</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="admin-card">
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Premium</th>
                <th>Available</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td><span className="badge badge-category">{CATEGORY_LABELS[item.category] || item.category}</span></td>
                  <td>Rs. {item.price}</td>
                  <td>{item.is_premium ? '&#9733;' : '-'}</td>
                  <td>
                    <span className={`badge badge-${item.is_available ? 'green' : 'red'}`}>
                      {item.is_available ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editId ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>

            {formError && <div className="alert alert-error">{formError}</div>}

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price (Rs.)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    min="0"
                    step="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input"
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group form-checkbox-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_premium}
                      onChange={e => setForm({ ...form, is_premium: e.target.checked })}
                    />
                    Premium Item
                  </label>
                </div>
                <div className="form-group form-checkbox-group">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.is_available}
                      onChange={e => setForm({ ...form, is_available: e.target.checked })}
                    />
                    Available
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                  {formLoading ? 'Saving...' : (editId ? 'Update Item' : 'Add Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
