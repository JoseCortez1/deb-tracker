import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './auth/AuthContext.jsx';
import { BarChart } from './components/BarChart.jsx';
import { DebtAvatar } from './components/DebtAvatar.jsx';
import { DebtIdentityModal } from './components/DebtIdentityModal.jsx';
import { DonutChart } from './components/DonutChart.jsx';
import { ExpensesPage } from './features/expenses/components/ExpensesPage.jsx';
import {
  EXTRA_DEBT_COLORS,
  TABS,
} from './constants.js';
import { calculatePayoffTimeline } from './utils/payoff.js';
import { useNavigation } from './navigation/NavigationContext.jsx';
import { fmt, pct } from './utils/format.js';

export default function App() {
  const { path, navigate } = useNavigation();
  const { logout } = useAuth();
  const lastMainTabRef = useRef('dashboard');
  const [tab, setTab] = useState(() => path === '/expenses' ? 'expenses' : 'dashboard');
  const [debts, setDebts] = useState([]);
  const [income, setIncome] = useState(0);
  const [livingExpenses, setLivingExpenses] = useState(0);
  const [completedMonths, setCompletedMonths] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountDesc, setNewAccountDesc] = useState('');
  const [newAccountEmoji, setNewAccountEmoji] = useState('💳');
  const [startMonth, setStartMonth] = useState(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  });
  const [identityModal, setIdentityModal] = useState(null);

  // Load initial data from API
  useEffect(() => {
    api.get('/api/debts').then(setDebts).catch(() => {});
    api.get('/api/config/income').then(d => { if (d.value) setIncome(Number(d.value)); }).catch(() => {});
    api.get('/api/config/expenses').then(d => { if (d.value) setLivingExpenses(Number(d.value)); }).catch(() => {});
    api.get('/api/config/userAccounts').then(d => { if (d.value) setUserAccounts(JSON.parse(d.value)); }).catch(() => {});
    api.get('/api/config/startMonth').then(d => { if (d.value) setStartMonth(d.value); }).catch(() => {});
    api.get('/api/config/completedMonths').then(d => { if (d.value) setCompletedMonths(JSON.parse(d.value)); }).catch(() => {});
  }, []);

  // Save data to API on change
  useEffect(() => { api.put('/api/config/income', { value: String(income) }).catch(() => {}); }, [income]);
  useEffect(() => { api.put('/api/config/expenses', { value: String(livingExpenses) }).catch(() => {}); }, [livingExpenses]);
  useEffect(() => { api.put('/api/config/userAccounts', { value: JSON.stringify(userAccounts) }).catch(() => {}); }, [userAccounts]);
  useEffect(() => { api.put('/api/config/startMonth', { value: startMonth }).catch(() => {}); }, [startMonth]);
  useEffect(() => { api.put('/api/config/completedMonths', { value: JSON.stringify(completedMonths) }).catch(() => {}); }, [completedMonths]);

  // Sync debts to API
  useEffect(() => {
    const timer = setTimeout(() => {
      const save = async () => {
        for (const d of debts) {
          try { await api.put('/api/debts/' + d.id, d); } catch {}
        }
      };
      save();
    }, 1000);
    return () => clearTimeout(timer);
  }, [debts]);

  const totalInitial = debts.reduce((s, d) => s + Number(d.initialBalance), 0);
  const totalCurrent = debts.reduce((s, d) => s + Number(d.currentBalance), 0);
  const totalPaid = totalInitial - totalCurrent;
  const progress = pct(totalPaid, totalInitial);
  const minPayments = debts.filter((d) => !d.paid).reduce((s, d) => s + Number(d.minPayment), 0);
  const payoffTimeline = useMemo(() => calculatePayoffTimeline(debts, income, livingExpenses, startMonth), [debts, income, livingExpenses, startMonth]);
  const available = income - livingExpenses - minPayments;

  useEffect(() => {
    if (path === '/expenses') { setTab('expenses'); }
    else if (tab === 'expenses') { setTab(lastMainTabRef.current); }
  }, [path, tab]);

  const selectTab = (k) => {
    if (k === 'expenses') { setTab('expenses'); navigate('/expenses'); return; }
    lastMainTabRef.current = k;
    setTab(k);
    navigate('/');
  };

  const updateDebt = (id, field, val) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, [field]: Number(val) || 0, paid: field === 'currentBalance' && Number(val) === 0 ? true : d.paid } : d));
  };

  const togglePaid = (id) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, paid: !d.paid, currentBalance: !d.paid ? 0 : d.initialBalance } : d));
  };

  const toggleMonth = (idx) => {
    setCompletedMonths((prev) => prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]);
  };

  const resetAll = () => {
    if (confirm('Resetear todos los datos al inicio?')) {
      setDebts([]);
      setIncome(0);
      setLivingExpenses(0);
      setCompletedMonths([]);
    }
  };

  const handleDeleteAccount = (idx) => {
    setUserAccounts(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSaveAccount = () => {
    if (newAccountName.trim()) {
      const color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
      setUserAccounts(prev => [...prev, {
        name: newAccountName.trim(),
        description: newAccountDesc.trim(),
        emoji: newAccountEmoji || '💳',
        color
      }]);
      setNewAccountName('');
      setNewAccountDesc('');
      setNewAccountEmoji('💳');
      setShowAddAccount(false);
    }
  };

  const handleSaveAddDebt = (payload) => {
    const id = debts.length ? Math.max(...debts.map((d) => d.id)) + 1 : 1;
    const color = EXTRA_DEBT_COLORS[(id - 1) % EXTRA_DEBT_COLORS.length];
    const newDebt = { id, name: payload.name, emoji: payload.emoji, iconUrl: payload.iconUrl, initialBalance: payload.initialBalance, currentBalance: payload.currentBalance, minPayment: payload.minPayment, color, paid: false };
    setDebts((prev) => [...prev, newDebt]);
    api.post('/api/debts', newDebt).catch(() => {});
  };

  const handleSaveEditDebt = (id, payload) => {
    setDebts((prev) => prev.map((d) => d.id === id ? { ...d, ...payload } : d));
  };

  return (
    <div className="app">
      <div className="header">
        <div className="header-left">
          <h1>Plan de <span>Liquidación</span></h1>
          <div className="header-left-row">
            <p>Personaliza tus datos financieros en Configuración</p>
            <button type="button" className="btn-ghost header-logout"
              onClick={() => { if (confirm('Cerrar sesión?')) logout(); }}>
              Cerrar sesión
            </button>
          </div>
        </div>
        <div className="header-right">
          <div className="header-badge">
            <div className="label">Total restante</div>
            <div className="value">{fmt(totalCurrent)}</div>
            <div className="sub">{progress}% liberado · Meta: Sep 2026</div>
          </div>
        </div>
      </div>

      <div className="global-progress animate-in">
        <div className="progress-header">
          <span>PROGRESO GLOBAL</span>
          <strong>{fmt(totalPaid)} pagados de {fmt(totalInitial)}</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="tabs" role="tablist">
        {TABS.map(([k, icon, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} aria-label={label} title={label}
            className={`tab-btn${tab === k ? ' active' : ''}`} onClick={() => selectTab(k)}>
            <span className="tab-icon">{icon}</span>
            <span className="tab-label">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'expenses' && <ExpensesPage />}

      {tab === 'dashboard' && (
        <div className="animate-in">
          <div className="grid-3">
            <div className="stat-card" style={{ '--accent-color': '#4fd1a5' }}>
              <div className="stat-label">Disponible para atacar</div>
              <div className="stat-value" style={{ color: available > 0 ? '#4fd1a5' : '#e05a6b' }}>{fmt(available)}</div>
              <div className="stat-sub">ingreso − gastos − mínimos</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#4a8cf7' }}>
              <div className="stat-label">Ingreso mensual</div>
              <div className="stat-value">{fmt(income)}</div>
              <div className="stat-sub">día 15 de cada mes</div>
            </div>
            <div className="stat-card" style={{ '--accent-color': '#a78bfa' }}>
              <div className="stat-label">Mínimos totales</div>
              <div className="stat-value">{fmt(minPayments)}</div>
              <div className="stat-sub">{debts.filter((d) => !d.paid).length} deudas activas</div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-title"><span className="dot" style={{ background: '#4a8cf7' }} /> Distribución de deuda</div>
              <div className="chart-wrap" style={{ maxHeight: 240 }}><DonutChart debts={debts} /></div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                {debts.map((d) => (
                  <span key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: d.paid ? '#4fd1a5' : '#6b7a9e', fontFamily: 'var(--mono)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                    {d.name} {d.paid ? '✓' : fmt(d.currentBalance)}
                  </span>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title"><span className="dot" style={{ background: '#f0c040' }} /> Estado de deudas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {debts.map((d) => {
                  const p = pct(d.initialBalance - d.currentBalance, d.initialBalance);
                  return (
                    <div key={d.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                        <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <DebtAvatar debt={d} size={18} /> {d.name}
                        </span>
                        <span style={{ fontFamily: 'var(--mono)', color: d.paid ? '#4fd1a5' : '#e8edf7', fontSize: 12 }}>
                          {d.paid ? 'LIQUIDADA' : fmt(d.currentBalance)}
                        </span>
                      </div>
                      <div className="debt-bar"><div className="debt-bar-fill" style={{ width: `${p}%`, '--bar-color': d.color }} /></div>
                    </div>
                  );
                })}
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1, background: 'rgba(79,209,165,0.08)', border: '1px solid rgba(79,209,165,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#4fd1a5', marginBottom: 4 }}>PAGADO</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: '#4fd1a5' }}>{fmt(totalPaid)}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(224,90,107,0.08)', border: '1px solid rgba(224,90,107,0.2)', borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: '#e05a6b', marginBottom: 4 }}>RESTANTE</div>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: '#e05a6b' }}>{fmt(totalCurrent)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
          </div>
        </div>
      )}

      {tab === 'debts' && (
        <div className="animate-in">
          <div className="debts-section-head">
            <div className="section-title section-title--inline">
              Mis Deudas <span>· Edita saldo actual para registrar pagos</span>
            </div>
            <button type="button" className="btn" onClick={() => setIdentityModal({ variant: 'add' })}>Agregar deuda</button>
          </div>
          <div className="debt-list">
            {debts.map((d) => {
              const p = pct(d.initialBalance - d.currentBalance, d.initialBalance);
              return (
                <div key={d.id} className={`debt-item${d.paid ? ' paid' : ''}`} style={{ borderLeft: `3px solid ${d.color}` }}>
                  <div className="debt-header">
                    <div className="debt-name"><DebtAvatar debt={d} className="emoji" size={20} /><span className="debt-title-text">{d.name}</span></div>
                    <div className="debt-header-actions">
                      <button type="button" className="btn-ghost debt-inline-edit" onClick={() => setIdentityModal({ variant: 'edit', id: d.id })}>Editar</button>
                      <button type="button" className="btn-ghost" onClick={() => togglePaid(d.id)}>{d.paid ? 'Reabrir' : 'Marcar pagada'}</button>
                    </div>
                  </div>
                  {!d.paid && (
                    <>
                      <div className="debt-inputs">
                        <div><div className="debt-mini-label">Saldo inicial</div><input className="debt-mini-input" type="number" value={d.initialBalance} onChange={(e) => updateDebt(d.id, 'initialBalance', e.target.value)} /></div>
                        <div><div className="debt-mini-label">Saldo actual</div><input className="debt-mini-input" type="number" value={d.currentBalance} onChange={(e) => updateDebt(d.id, 'currentBalance', e.target.value)} /></div>
                        <div><div className="debt-mini-label">Pago mínimo</div><input className="debt-mini-input" type="number" value={d.minPayment} onChange={(e) => updateDebt(d.id, 'minPayment', e.target.value)} /></div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}><div className="debt-mini-label">Progreso</div><div style={{ fontFamily: 'var(--mono)', fontSize: 20, fontWeight: 800, color: d.color }}>{p}%</div></div>
                      </div>
                      <div className="debt-bar" style={{ marginTop: 12 }}><div className="debt-bar-fill" style={{ width: `${p}%`, '--bar-color': d.color }} /></div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <hr className="divider" />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
              Total activo: <strong style={{ color: 'var(--accent)' }}>{fmt(totalCurrent)}</strong>
            </div>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontFamily: 'var(--mono)', fontSize: 13 }}>
              Mínimos: <strong style={{ color: 'var(--blue)' }}>{fmt(minPayments)}</strong>
            </div>
          </div>
        </div>
      )}

      {tab === 'charts' && (
        <div className="animate-in">
          <div className="section-title">Gráficas <span>· Visualización del progreso</span></div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><span className="dot" style={{ background: '#4a8cf7' }} /> Saldo inicial vs actual por deuda</div>
            <div className="chart-wrap"><BarChart debts={debts} /></div>
          </div>
          <div className="grid-2">
            <div className="card">
              <div className="card-title"><span className="dot" style={{ background: '#a78bfa' }} /> Distribución actual</div>
              <div className="chart-wrap" style={{ maxHeight: 260 }}><DonutChart debts={debts} /></div>
            </div>
            <div className="card">
              <div className="card-title"><span className="dot" style={{ background: '#4fd1a5' }} /> Flujo mensual</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
                {[
                  { label: 'Ingreso', value: income, color: '#4fd1a5', pct: 100 },
                  { label: 'Gastos vida', value: livingExpenses, color: '#4a8cf7', pct: pct(livingExpenses, income) },
                  { label: 'Mínimos', value: minPayments, color: '#a78bfa', pct: pct(minPayments, income) },
                  { label: 'Disponible ataque', value: Math.max(0, available), color: '#f0c040', pct: pct(Math.max(0, available), income) },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: 'var(--muted)' }}>{item.label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: item.color }}>{fmt(item.value)}</span>
                    </div>
                    <div className="debt-bar"><div className="debt-bar-fill" style={{ width: `${item.pct}%`, '--bar-color': item.color }} /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="animate-in">
          <div className="section-title">Ruta al 0 <span>{'·'} Plan de pago personalizado</span></div>
          <div className="timeline">
            {payoffTimeline.length === 0 ? (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: 40, fontFamily: 'var(--mono)' }}>
                Ajusta tu ingreso, gastos y mes de inicio en Configuración para generar tu ruta.
              </p>
            ) : (
              payoffTimeline.map((item, i) => {
                const done = completedMonths.includes(i);
                const totalDebt = item.debts.reduce((s, d) => s + d.balance, 0);
                return (
                  <div key={i} className="tl-item">
                    <div className="tl-date">
                      <strong>{item.month.split(' ')[0]}</strong>
                      {' '}{item.month.split(' ').slice(1).join(' ')}
                    </div>
                    <div className="tl-line-wrap">
                      <div className={`tl-dot${done ? ' done' : ''}`}
                        style={{ '--dot-color': done ? '#4fd1a5' : '#1f2a45' }}>
                        {done ? '✓' : i + 1}
                      </div>
                      {i < payoffTimeline.length - 1 && <div className="tl-connector" />}
                    </div>
                    <div role="button" tabIndex={0}
                      className={`tl-body${done ? ' done' : ''}`}
                      onClick={() => toggleMonth(i)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMonth(i); } }}
                      style={{ cursor: 'pointer' }}>
                      <div className="tl-month">{item.month}</div>
                      <div className="tl-goal">{item.goal || 'Pagando deudas'}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: 6 }}>
                        {item.debts.filter(d => d.balance > 0).map(d => (
                          <span key={d.id} className="tl-badge"
                            style={{ background: d.color + '22', color: 'var(--text)' }}>
                            {d.emoji} {fmt(d.balance)}
                          </span>
                        ))}
                      </div>
                      {item.badge && <span className="tl-badge" style={{ marginTop: 4 }}>{item.badge}</span>}
                      {done && <span className="tl-badge" style={{ marginLeft: 8, background: 'rgba(240,192,64,0.1)', color: 'var(--accent)' }}>COMPLETADO</span>}
                      <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)', marginTop: 6 }}>
                        Restante: {fmt(totalDebt)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}      {tab === 'settings' && (
        <div className="animate-in">
          <div className="section-title">Configuración <span>· Ajusta tus números reales</span></div>
          <div className="two-col-settings" style={{ marginBottom: 24 }}>
            <div className="card income-card">
              <div className="card-title"><span className="dot" /> Flujo mensual</div>
              <div className="input-group"><label htmlFor="income">Ingreso mensual</label><input id="income" type="number" value={income} onChange={(e) => setIncome(Number(e.target.value))} /></div>
              <div className="input-group"><label htmlFor="expenses">Gastos de vida ajustados (sin despensa)</label><input id="expenses" type="number" value={livingExpenses} onChange={(e) => setLivingExpenses(Number(e.target.value))} /></div>
              <hr className="divider" />
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Ingreso</span><span style={{ color: 'var(--text)' }}>{fmt(income)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Gastos</span><span style={{ color: '#e05a6b' }}>−{fmt(livingExpenses)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span>Mínimos</span><span style={{ color: '#a78bfa' }}>−{fmt(minPayments)}</span></div>
                <hr className="divider" style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontWeight: 700 }}>Disponible</span><span style={{ color: available >= 0 ? '#4fd1a5' : '#e05a6b', fontWeight: 800 }}>{fmt(available)}</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-title"><span className="dot" style={{ background: '#4a8cf7' }} /> Sistema de cuentas</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {userAccounts.length === 0 ? (
                  <p style={{ color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--mono)', textAlign: 'center', padding: 20 }}>
                    Aún no has configurado tus cuentas.
                    <br />
                    <button type="button" className="btn-ghost" style={{ marginTop: 8 }} onClick={() => setShowAddAccount(true)}>
                      + Agregar cuenta
                    </button>
                  </p>
                ) : (
                  userAccounts.map((acct, i) => (
                    <div key={i} style={{
                      background: acct.color + '14',
                      border: '1px solid ' + acct.color + '33',
                      borderRadius: 10, padding: '14px 16px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: 18, marginRight: 8 }}>{acct.emoji}</span>
                          <strong>{acct.name}</strong>
                        </div>
                        <button type="button" className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }}
                          onClick={() => handleDeleteAccount(i)}>Eliminar</button>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginTop: 6 }}>
                        {acct.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {showAddAccount && (
                <div style={{ marginTop: 12, padding: 14, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="input-group" style={{ marginBottom: 8 }}>
                    <label>Nombre</label>
                    <input type="text" value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="Ej. BBVA" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 8 }}>
                    <label>Descripción</label>
                    <input type="text" value={newAccountDesc}
                      onChange={(e) => setNewAccountDesc(e.target.value)}
                      placeholder="Ej. Pagos programados, renta y deudas" />
                  </div>
                  <div className="input-group" style={{ marginBottom: 8 }}>
                    <label>Emoji</label>
                    <input type="text" value={newAccountEmoji}
                      onChange={(e) => setNewAccountEmoji(e.target.value)}
                      style={{ width: 60, textAlign: 'center' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn" onClick={handleSaveAccount}>Guardar</button>
                    <button type="button" className="btn-ghost" onClick={() => setShowAddAccount(false)}>Cancelar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-title"><span className="dot" style={{ background: '#e05a6b' }} /> Saldos iniciales de referencia</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {debts.map((d) => (
                <div key={d.id} style={{ background: 'var(--surface)', borderRadius: 10, padding: '12px 14px', borderLeft: `3px solid ${d.color}` }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DebtAvatar debt={d} size={18} /> {d.name}
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label htmlFor={`initial-${d.id}`}>Saldo inicial</label>
                    <input id={`initial-${d.id}`} type="number" value={d.initialBalance} onChange={(e) => updateDebt(d.id, 'initialBalance', e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={resetAll} style={{ color: '#e05a6b', borderColor: 'rgba(224,90,107,0.3)' }}>Resetear al inicio</button>
          </div>
        </div>
      )}

      <DebtIdentityModal
        open={identityModal != null}
        variant={identityModal?.variant}
        debt={identityModal?.variant === 'edit' ? debts.find((d) => d.id === identityModal.id) : null}
        onClose={() => setIdentityModal(null)}
        onSaveAdd={handleSaveAddDebt}
        onSaveEdit={handleSaveEditDebt}
      />
    </div>
  );
}
