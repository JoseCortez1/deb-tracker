import { useId, useState } from 'react';

export function CategoryManager({ open, onClose, customCategories = [], addCustomCategory, removeCustomCategory }) {
  const titleId = useId();
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📌');
  const [error, setError] = useState('');

  if (!open) return null;

  const builtInNames = ['Comida y restaurantes', 'Transporte', 'Hogar y renta', 'Salud', 'Entretenimiento', 'Compras', 'Educación', 'Ahorro', 'Otros'];
  const builtInIds = ['food', 'transport', 'housing', 'health', 'entertainment', 'shopping', 'education', 'savings', 'other'];
  const builtInIcons = ['🍽️', '🚗', '🏠', '🏥', '🎬', '🛍️', '📚', '💰', '📌'];
  const builtInMap = builtInIds.map((id, i) => ({ id, name: builtInNames[i], icon: builtInIcons[i] }));

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) { setError('Escribe un nombre para la categoría.'); return; }
    if (builtInNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
      setError('Ya existe una categoría predefinida con ese nombre.'); return;
    }
    if (customCategories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      setError('Ya tienes una categoría personalizada con ese nombre.'); return;
    }
    addCustomCategory(name, newIcon);
    setNewName(''); setNewIcon('📌'); setError('');
  };

  const handleRemove = (id, name) => {
    if (window.confirm(`¿Eliminar la categoría "${name}"?\n\nLos gastos existentes con esta categoría no se borrarán, pero desaparecerá de las opciones.`)) {
      removeCustomCategory(id);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal-panel category-manager-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="modal-title">⚙️ Gestionar Categorías</h2>
        <div className="category-manager-section">
          <h3 className="category-manager-section-title">Categorías predefinidas</h3>
          <div className="category-manager-builtin-list">
            {builtInMap.map((b) => (
              <span key={b.id} className="category-manager-chip category-manager-chip--builtin">{b.icon} {b.name}</span>
            ))}
          </div>
        </div>
        <div className="category-manager-section">
          <h3 className="category-manager-section-title">Tus categorías {customCategories.length > 0 && `(${customCategories.length})`}</h3>
          {customCategories.length === 0 ? (
            <p className="category-manager-empty">Aún no has creado categorías personalizadas.</p>
          ) : (
            <div className="category-manager-custom-list">
              {customCategories.map((cat) => (
                <div key={cat.id} className="category-manager-custom-row">
                  <span className="category-manager-custom-icon">{cat.icon}</span>
                  <span className="category-manager-custom-name">{cat.name}</span>
                  <button type="button" className="btn-ghost category-manager-delete-btn" onClick={() => handleRemove(cat.id, cat.name)} title="Eliminar categoría">✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="category-manager-section category-manager-add-section">
          <h3 className="category-manager-section-title">Agregar nueva categoría</h3>
          <div className="category-manager-add-row">
            <select className="input-select category-manager-icon-select" value={newIcon} onChange={(e) => setNewIcon(e.target.value)}>
              {['📌','🐾','💡','🎮','🎵','📱','👕','🏋️','✈️','🎁','💊','📦','🔧','🌿','🎨'].map((ic) => (<option key={ic} value={ic}>{ic}</option>))}
            </select>
            <input type="text" className="category-manager-name-input" placeholder="Nombre de la categoría" value={newName}
              onChange={(e) => { setNewName(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }}} />
            <button type="button" className="btn" onClick={handleAdd}>Agregar</button>
          </div>
          {error && <span className="input-error" role="alert">{error}</span>}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
