import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, fetchAllDocuments, Query } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { DB_ID, COLLECTIONS } from '../../lib/constants';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Employee, EvaluationCycle, Response, EvaluationAssignment } from '../../types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface EmployeeStats extends Employee {
  evaluatorCount: number;
  assignedCount: number;
  selfScore: number | null;
  collectiveScore: number | null;
}

type Tab = 'resultados' | 'ciclos' | 'asignaciones';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ScoreChip({ value }: { value: number | null }) {
  if (value === null) return <span className="text-surface-300 text-xs">—</span>;
  const pct = Math.round(value * 100);
  const color =
    pct >= 75 ? 'text-green-700 bg-green-50 border-green-100' :
    pct >= 50 ? 'text-amber-700 bg-amber-50 border-amber-100' :
    'text-red-700 bg-red-50 border-red-100';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>
      {pct}%
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    active:  { label: 'Activo',   className: 'bg-green-50 text-green-700 border-green-200' },
    draft:   { label: 'Borrador', className: 'bg-surface-100 text-surface-500 border-surface-200' },
    closed:  { label: 'Cerrado',  className: 'bg-red-50 text-red-600 border-red-100' },
  };
  const cfg = map[status] ?? map.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.className}`}>
      {status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
      {cfg.label}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('resultados');

  // Shared state
  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [allCycles, setAllCycles] = useState<EvaluationCycle[]>([]);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [assignments, setAssignments] = useState<EvaluationAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const cyclesResult = await databases.listDocuments(DB_ID, COLLECTIONS.EVALUATION_CYCLES, [
        Query.orderDesc('$createdAt'),
      ]);
      const cycles = cyclesResult.documents as unknown as EvaluationCycle[];
      setAllCycles(cycles);
      const active = cycles.find((c) => c.status === 'active') ?? null;
      setCycle(active);

      const allEmps = await fetchAllDocuments<Employee>(COLLECTIONS.EMPLOYEES, [
        Query.equal('role', 'employee'),
      ]);

      if (!active) {
        setEmployees(allEmps.map((e) => ({ ...e, evaluatorCount: 0, assignedCount: 0, selfScore: null, collectiveScore: null })));
        setAssignments([]);
        return;
      }

      const [allResponses, allQuestions, cycleAssignments] = await Promise.all([
        fetchAllDocuments<Response>(COLLECTIONS.RESPONSES, [Query.equal('cycle_id', active.$id)]),
        fetchAllDocuments<{ $id: string }>(COLLECTIONS.QUESTIONS),
        fetchAllDocuments<EvaluationAssignment>(COLLECTIONS.EVALUATION_ASSIGNMENTS, [Query.equal('cycle_id', active.$id)]),
      ]);

      setAssignments(cycleAssignments);
      const totalQuestions = allQuestions.length;

      const stats: EmployeeStats[] = allEmps.map((emp) => {
        const myResponses = allResponses.filter((r) => r.evaluated_id === emp.$id);
        const selfResponses = myResponses.filter((r) => r.evaluation_type === 'self');
        const peerResponses = myResponses.filter((r) => r.evaluation_type === 'peer');
        const uniquePeerEvaluators = new Set(peerResponses.map((r) => r.evaluator_id)).size;
        const assignedCount = cycleAssignments.filter((a) => a.evaluated_id === emp.$id).length;

        const selfScore = selfResponses.length > 0 && totalQuestions > 0
          ? selfResponses.reduce((s, r) => s + r.score, 0) / totalQuestions : null;
        const collectiveScore = peerResponses.length > 0 && uniquePeerEvaluators > 0 && totalQuestions > 0
          ? peerResponses.reduce((s, r) => s + r.score, 0) / (totalQuestions * uniquePeerEvaluators) : null;

        return { ...emp, evaluatorCount: uniquePeerEvaluators, assignedCount, selfScore, collectiveScore };
      });
      setEmployees(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'resultados', label: 'Resultados',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
    },
    {
      id: 'ciclos', label: 'Ciclos',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    },
    {
      id: 'asignaciones', label: 'Asignaciones',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
    },
  ];

  return (
    <div className="min-h-screen bg-surface-100 md:pl-64">
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-surface-800">Panel Administrativo</h1>
          <p className="text-surface-400 text-sm mt-1">
            {cycle
              ? <span>Ciclo activo: <span className="font-semibold text-surface-600">{cycle.name}</span></span>
              : 'Sin ciclo activo — ve a la pestaña Ciclos para crear uno.'}
          </p>
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white border border-surface-200 rounded-2xl p-1.5 mb-6 w-fit shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                  : 'text-surface-500 hover:text-surface-800 hover:bg-surface-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {loading ? <LoadingSpinner /> : (
          <>
            {activeTab === 'resultados' && (
              <ResultsTab employees={employees} cycle={cycle} onViewReport={(id) => navigate(`/admin/reporte/${id}`)} />
            )}
            {activeTab === 'ciclos' && (
              <CyclesTab cycles={allCycles} onRefresh={loadData} />
            )}
            {activeTab === 'asignaciones' && (
              <AssignmentsTab
                cycle={cycle}
                employees={employees}
                assignments={assignments}
                onRefresh={loadData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

// ─── TAB 1: Resultados ───────────────────────────────────────────────────────

function ResultsTab({
  employees,
  cycle,
  onViewReport,
}: {
  employees: EmployeeStats[];
  cycle: EvaluationCycle | null;
  onViewReport: (id: string) => void;
}) {
  const completedCount = employees.filter((e) => e.collectiveScore !== null).length;

  function exportToCSV() {
    if (employees.length === 0) return;
    const headers = ['Colaborador', 'Area', 'Evaluadores Asignados', 'Evaluadores Completados', 'Autoevaluacion', 'Calificacion Colectiva'];
    const rows = employees.map((emp) => {
      const auto = emp.selfScore !== null ? Math.round(emp.selfScore * 100) + '%' : 'N/A';
      const col = emp.collectiveScore !== null ? Math.round(emp.collectiveScore * 100) + '%' : 'N/A';
      return [`"${emp.name}"`, `"${emp.department ?? ''}"`, emp.assignedCount, emp.evaluatorCount, `"${auto}"`, `"${col}"`].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const link = document.createElement('a');
    link.href = encodeURI(csvContent);
    link.download = `resultados_${cycle?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() ?? 'general'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (!cycle) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-surface-600 font-semibold">Sin ciclo activo</p>
        <p className="text-surface-400 text-sm mt-1">Activa un ciclo desde la pestaña <strong>Ciclos</strong> para ver resultados.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Colaboradores totales', value: employees.length, color: 'text-surface-800' },
          { label: 'Con evaluaciones completas', value: completedCount, color: 'text-green-600' },
          { label: 'Sin evaluaciones aún', value: employees.length - completedCount, color: 'text-amber-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-surface-200 p-5">
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-surface-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 className="font-semibold text-surface-800 text-sm">Resultados del ciclo</h2>
          <button
            onClick={exportToCSV}
            disabled={employees.length === 0}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-50 border border-surface-200 hover:bg-surface-100 text-surface-700 text-xs font-medium transition-colors disabled:opacity-40"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar CSV
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/60">
              <th className="px-6 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Colaborador</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Área</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Evaluadores</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Autoevaluación</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Colectiva</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-surface-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {employees.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-surface-400 text-sm">No hay colaboradores registrados.</td></tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.$id} className="hover:bg-surface-50/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary-600">{emp.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium text-surface-800">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-surface-500">{emp.department ?? '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-medium text-surface-600">
                      {emp.evaluatorCount}/{emp.assignedCount}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center"><ScoreChip value={emp.selfScore} /></td>
                  <td className="px-6 py-4 text-center"><ScoreChip value={emp.collectiveScore} /></td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onViewReport(emp.$id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                    >
                      Ver reporte
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── TAB 2: Ciclos ───────────────────────────────────────────────────────────

function CyclesTab({ cycles, onRefresh }: { cycles: EvaluationCycle[]; onRefresh: () => void }) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [saving, setSaving] = useState(false);

  async function createCycle() {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await databases.createDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, ID.unique(), {
        name: name.trim(),
        status: 'draft',
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      setName(''); setStartDate(''); setEndDate('');
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  }

  function startEdit(c: EvaluationCycle) {
    setEditingId(c.$id);
    setEditName(c.name);
    setEditStart(c.start_date ? c.start_date.slice(0, 10) : '');
    setEditEnd(c.end_date ? c.end_date.slice(0, 10) : '');
  }

  async function saveEdit() {
    if (!editingId) return;
    setSaving(true);
    try {
      await databases.updateDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, editingId, {
        name: editName.trim(),
        start_date: editStart || undefined,
        end_date: editEnd || undefined,
      });
      setEditingId(null);
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function setStatus(cycleId: string, status: 'active' | 'closed') {
    try {
      if (status === 'active') {
        for (const c of cycles.filter((c) => c.status === 'active')) {
          await databases.updateDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, c.$id, { status: 'closed' });
        }
      }
      await databases.updateDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, cycleId, { status });
      onRefresh();
    } catch (err) { console.error(err); }
  }

  return (
    <div className="grid md:grid-cols-5 gap-6">
      {/* Left: Create form */}
      <div className="md:col-span-2">
        <div className="bg-white rounded-2xl border border-surface-200 p-6 sticky top-6">
          <h2 className="font-semibold text-surface-800 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            Crear Nuevo Ciclo
          </h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Nombre del ciclo *</label>
              <input
                type="text"
                placeholder="Ej: Evaluación Q3 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Fecha de inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-surface-500 mb-1 block">Fecha límite</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-200 bg-surface-50 text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 focus:bg-white transition-colors"
              />
            </div>
            <button
              onClick={createCycle}
              disabled={!name.trim() || creating}
              className="w-full mt-1 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              {creating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</> : 'Crear Ciclo'}
            </button>
          </div>
        </div>
      </div>

      {/* Right: List */}
      <div className="md:col-span-3 flex flex-col gap-3">
        <h2 className="font-semibold text-surface-800 text-sm px-1">Todos los ciclos ({cycles.length})</h2>
        {cycles.length === 0 && (
          <div className="bg-white rounded-2xl border border-surface-200 p-10 text-center text-surface-400 text-sm">
            No hay ciclos aún. Crea el primero.
          </div>
        )}
        {cycles.map((c) => (
          <div key={c.$id} className="bg-white rounded-2xl border border-surface-200 overflow-hidden transition-shadow hover:shadow-sm">
            {editingId === c.$id ? (
              /* ── Edit mode ── */
              <div className="p-5 flex flex-col gap-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-primary-300 bg-primary-50/30 text-sm font-medium text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-surface-400 mb-1 block">Inicio</label>
                    <input type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                  </div>
                  <div>
                    <label className="text-xs text-surface-400 mb-1 block">Límite</label>
                    <input type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-surface-200 bg-surface-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-4 py-2 rounded-xl border border-surface-200 text-surface-500 text-sm hover:bg-surface-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              /* ── View mode ── */
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-surface-800">{c.name}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-surface-400">
                      {c.start_date && <span>Inicio: {new Date(c.start_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {c.end_date && <span>Límite: {new Date(c.end_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      {!c.start_date && !c.end_date && <span>Sin fechas definidas</span>}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-surface-100">
                  <button onClick={() => startEdit(c)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-surface-600 border border-surface-200 hover:bg-surface-50 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Editar
                  </button>
                  {c.status === 'draft' && (
                    <button onClick={() => setStatus(c.$id, 'active')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      Activar
                    </button>
                  )}
                  {c.status === 'active' && (
                    <button onClick={() => setStatus(c.$id, 'closed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 hover:bg-amber-100 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                      Cerrar ciclo
                    </button>
                  )}
                  {c.status === 'closed' && (
                    <button onClick={() => setStatus(c.$id, 'active')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary-700 border border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors">
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 3: Asignaciones ─────────────────────────────────────────────────────

function AssignmentsTab({
  cycle,
  employees,
  assignments,
  onRefresh,
}: {
  cycle: EvaluationCycle | null;
  employees: EmployeeStats[];
  assignments: EvaluationAssignment[];
  onRefresh: () => void;
}) {
  const [selectedEvaluated, setSelectedEvaluated] = useState<EmployeeStats | null>(null);
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // When user selects an employee to configure, load their current evaluators
  function selectEmployee(emp: EmployeeStats) {
    setSelectedEvaluated(emp);
    setSaved(false);
    const current = assignments
      .filter((a) => a.evaluated_id === emp.$id)
      .map((a) => a.evaluator_id);
    setSelectedEvaluatorIds(new Set(current));
  }

  function toggleEvaluator(id: string) {
    const next = new Set(selectedEvaluatorIds);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedEvaluatorIds(next);
  }

  async function saveAssignments() {
    if (!cycle || !selectedEvaluated) return;
    setSaving(true);
    try {
      // Delete existing for this employee in this cycle
      const existing = assignments.filter(
        (a) => a.evaluated_id === selectedEvaluated.$id && a.cycle_id === cycle.$id
      );
      for (const a of existing) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.EVALUATION_ASSIGNMENTS, a.$id);
      }
      // Create new ones
      for (const evaluatorId of Array.from(selectedEvaluatorIds)) {
        await databases.createDocument(DB_ID, COLLECTIONS.EVALUATION_ASSIGNMENTS, ID.unique(), {
          cycle_id: cycle.$id,
          evaluated_id: selectedEvaluated.$id,
          evaluator_id: evaluatorId,
        });
      }
      setSaved(true);
      onRefresh();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  if (!cycle) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
        <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
        </div>
        <p className="text-surface-600 font-semibold">Sin ciclo activo</p>
        <p className="text-surface-400 text-sm mt-1">Activa un ciclo desde la pestaña <strong>Ciclos</strong> para asignar evaluadores.</p>
      </div>
    );
  }

  // Evaluator candidates: all employees except the one being evaluated
  const candidates = employees.filter((e) => e.$id !== selectedEvaluated?.$id);

  return (
    <div className="grid md:grid-cols-2 gap-6 h-[600px]">
      {/* Left: Who is being evaluated */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
          <h2 className="font-semibold text-surface-800 text-sm">¿Quién será evaluado?</h2>
          <p className="text-xs text-surface-400 mt-0.5">Selecciona a una persona para configurar sus evaluadores.</p>
        </div>
        <div className="overflow-y-auto flex-grow divide-y divide-surface-50">
          {employees.length === 0 && (
            <p className="p-6 text-sm text-surface-400 text-center">No hay colaboradores registrados.</p>
          )}
          {employees.map((emp) => {
            const count = assignments.filter((a) => a.evaluated_id === emp.$id).length;
            const isSelected = selectedEvaluated?.$id === emp.$id;
            return (
              <button
                key={emp.$id}
                onClick={() => selectEmployee(emp)}
                className={`w-full flex items-center justify-between px-5 py-3.5 text-left transition-colors ${
                  isSelected ? 'bg-primary-50 border-l-2 border-primary-500' : 'hover:bg-surface-50 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isSelected ? 'bg-primary-500 text-white' : 'bg-primary-50 text-primary-600'}`}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-surface-800'}`}>{emp.name}</p>
                    {emp.department && <p className="text-xs text-surface-400">{emp.department}</p>}
                  </div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                  count > 0
                    ? 'bg-green-50 text-green-700 border-green-100'
                    : 'bg-surface-100 text-surface-400 border-surface-200'
                }`}>
                  {count} evaluador{count !== 1 ? 'es' : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Who evaluates them */}
      <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden flex flex-col">
        {!selectedEvaluated ? (
          <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
            <div className="w-14 h-14 bg-surface-100 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>
            </div>
            <p className="text-surface-500 font-medium text-sm">Selecciona un colaborador</p>
            <p className="text-surface-400 text-xs mt-1">Elige a quién evaluar en la lista de la izquierda.</p>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-surface-100 bg-surface-50/60">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-surface-800 text-sm">¿Quién evalúa a <span className="text-primary-600">{selectedEvaluated.name.split(' ')[0]}</span>?</h2>
                  <p className="text-xs text-surface-400 mt-0.5">{selectedEvaluatorIds.size} personas seleccionadas</p>
                </div>
                <button
                  onClick={saveAssignments}
                  disabled={saving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    saved && !saving
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-primary-500 hover:bg-primary-600 text-white shadow-sm'
                  } disabled:opacity-50`}
                >
                  {saving ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                  ) : saved ? (
                    <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Guardado</>
                  ) : 'Guardar'}
                </button>
              </div>
            </div>
            <div className="overflow-y-auto flex-grow divide-y divide-surface-50">
              {candidates.length === 0 && (
                <p className="p-6 text-sm text-surface-400 text-center">No hay otros colaboradores disponibles.</p>
              )}
              {candidates.map((emp) => {
                const isChecked = selectedEvaluatorIds.has(emp.$id);
                return (
                  <label
                    key={emp.$id}
                    className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors ${isChecked ? 'bg-primary-50/40' : 'hover:bg-surface-50'}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${isChecked ? 'bg-primary-500 border-primary-500' : 'bg-white border-surface-300'}`}
                      onClick={() => toggleEvaluator(emp.$id)}>
                      {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <div className="flex items-center gap-3 flex-1" onClick={() => toggleEvaluator(emp.$id)}>
                      <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-semibold text-surface-500">{emp.name.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-800">{emp.name}</p>
                        {emp.department && <p className="text-xs text-surface-400">{emp.department}</p>}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
