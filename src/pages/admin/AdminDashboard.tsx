import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, fetchAllDocuments, Query } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { DB_ID, COLLECTIONS } from '../../lib/constants';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Employee, EvaluationCycle, Response } from '../../types';

interface EmployeeStats extends Employee {
  evaluatorCount: number;
  selfScore: number | null;
  collectiveScore: number | null;
}

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [allCycles, setAllCycles] = useState<EvaluationCycle[]>([]);
  const [employees, setEmployees] = useState<EmployeeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCycleModal, setShowCycleModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Load cycles
      const cyclesResult = await databases.listDocuments(DB_ID, COLLECTIONS.EVALUATION_CYCLES, [
        Query.orderDesc('$createdAt'),
      ]);
      const cycles = cyclesResult.documents as unknown as EvaluationCycle[];
      setAllCycles(cycles);
      const active = cycles.find((c) => c.status === 'active') ?? null;
      setCycle(active);

      // Load employees (non-admin only for evaluation purposes)
      const allEmployees = await fetchAllDocuments<Employee>(COLLECTIONS.EMPLOYEES, [
        Query.equal('role', 'employee'),
      ]);

      if (!active) {
        setEmployees(allEmployees.map((e) => ({ ...e, evaluatorCount: 0, selfScore: null, collectiveScore: null })));
        return;
      }

      // Load ALL responses for this cycle
      const allResponses = await fetchAllDocuments<Response>(COLLECTIONS.RESPONSES, [
        Query.equal('cycle_id', active.$id),
      ]);

      // Pre-load questions for normalization (we need to know total question count)
      const allQuestions = await fetchAllDocuments<{ $id: string }>(COLLECTIONS.QUESTIONS);
      const totalQuestions = allQuestions.length;

      // Compute stats per employee
      const stats: EmployeeStats[] = allEmployees.map((emp) => {
        const myResponses = allResponses.filter((r) => r.evaluated_id === emp.$id);
        const selfResponses = myResponses.filter((r) => r.evaluation_type === 'self');
        const peerResponses = myResponses.filter((r) => r.evaluation_type === 'peer');

        const uniquePeerEvaluators = new Set(peerResponses.map((r) => r.evaluator_id)).size;

        const selfScore =
          selfResponses.length > 0 && totalQuestions > 0
            ? selfResponses.reduce((s, r) => s + r.score, 0) / totalQuestions
            : null;

        const collectiveScore =
          peerResponses.length > 0 && uniquePeerEvaluators > 0 && totalQuestions > 0
            ? peerResponses.reduce((s, r) => s + r.score, 0) / (totalQuestions * uniquePeerEvaluators)
            : null;

        return {
          ...emp,
          evaluatorCount: uniquePeerEvaluators,
          selfScore,
          collectiveScore,
        };
      });

      setEmployees(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function exportToCSV() {
    if (employees.length === 0) return;
    
    const headers = ['Colaborador', 'Area', 'Evaluadores', 'Autoevaluacion', 'Calificacion Colectiva'];
    
    const rows = employees.map(emp => {
      const auto = emp.selfScore !== null ? Math.round(emp.selfScore * 100) + '%' : 'N/A';
      const col = emp.collectiveScore !== null ? Math.round(emp.collectiveScore * 100) + '%' : 'N/A';
      return [
        `"${emp.name}"`, 
        `"${emp.department ?? ''}"`, 
        emp.evaluatorCount, 
        `"${auto}"`, 
        `"${col}"`
      ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resultados_evaluacion_${cycle?.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() ?? 'general'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const completedCount = employees.filter((e) => e.collectiveScore !== null).length;

  return (
    <div className="min-h-screen bg-surface-100 md:pl-64">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-surface-800">Dashboard Administrativo</h1>
            <p className="text-surface-400 text-sm mt-1">
              {cycle ? `Ciclo activo: ${cycle.name}` : 'Sin ciclo activo'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToCSV}
              disabled={employees.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-surface-200 hover:bg-surface-50 text-surface-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar CSV
            </button>
            <button
              onClick={() => setShowCycleModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Gestionar ciclo
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Colaboradores"
            value={employees.length}
            icon={
              <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
          />
          <StatCard
            label="Con evaluaciones"
            value={completedCount}
            icon={
              <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Sin evaluaciones"
            value={employees.length - completedCount}
            icon={
              <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Table */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Colaborador</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-surface-400 uppercase tracking-wider">Área</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Evaluadores</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Autoevaluación</th>
                  <th className="px-6 py-3.5 text-center text-xs font-semibold text-surface-400 uppercase tracking-wider">Calificación Colectiva</th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-surface-400 uppercase tracking-wider">Reporte</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-surface-400 text-sm">
                      No hay colaboradores registrados.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.$id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-primary-600">
                              {emp.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-surface-800">{emp.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-500">{emp.department ?? '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-surface-700 font-medium">{emp.evaluatorCount}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ScoreChip value={emp.selfScore} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <ScoreChip value={emp.collectiveScore} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {cycle && (
                          <button
                            onClick={() => navigate(`/admin/asignaciones/${cycle.$id}?employee=${emp.$id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 mr-2 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                          >
                            Asignar evaluadores
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/admin/reporte/${emp.$id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-surface-200 text-xs font-medium text-surface-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        >
                          Ver reporte
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Cycle Modal */}
      {showCycleModal && (
        <CycleModal
          cycles={allCycles}
          onClose={() => setShowCycleModal(false)}
          onRefresh={() => { setShowCycleModal(false); loadData(); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-surface-200 p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-800">{value}</p>
        <p className="text-xs text-surface-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function ScoreChip({ value }: { value: number | null }) {
  if (value === null) return <span className="text-surface-300 text-xs">—</span>;
  const pct = Math.round(value * 100);
  const color =
    pct >= 75 ? 'text-green-600 bg-green-50' :
    pct >= 50 ? 'text-amber-600 bg-amber-50' :
    'text-red-600 bg-red-50';
  return (
    <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${color}`}>
      {pct}%
    </span>
  );
}

// ─── Cycle management modal ─────────────────────────────────────

function CycleModal({
  cycles,
  onClose,
  onRefresh,
}: {
  cycles: EvaluationCycle[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);

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
      setName('');
      setStartDate('');
      setEndDate('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  }

  async function setStatus(cycleId: string, status: 'active' | 'closed') {
    try {
      // If activating, close all others first
      if (status === 'active') {
        for (const c of cycles.filter((c) => c.status === 'active')) {
          await databases.updateDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, c.$id, { status: 'closed' });
        }
      }
      await databases.updateDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, cycleId, { status });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl border border-surface-200 shadow-xl w-full max-w-md">
        <div className="px-6 py-5 border-b border-surface-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-800">Gestión de Ciclos</h2>
          <button onClick={onClose} className="text-surface-400 hover:text-surface-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {/* New cycle */}
          <div className="flex flex-col gap-3 mb-6 bg-surface-50 p-4 rounded-xl border border-surface-200">
            <h3 className="text-sm font-semibold text-surface-700">Crear nuevo ciclo</h3>
            <div className="flex flex-col gap-2">
              <input
                type="text"
                placeholder="Nombre (Ej: Q2 2026)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-surface-200 bg-white text-sm text-surface-800 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  title="Fecha de inicio"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-surface-200 bg-white text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  title="Fecha de fin"
                  className="flex-1 px-3.5 py-2 rounded-xl border border-surface-200 bg-white text-sm text-surface-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                />
              </div>
              <button
                onClick={createCycle}
                disabled={!name.trim() || creating}
                className="w-full mt-1 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 text-white text-sm font-medium transition-colors"
              >
                Crear Ciclo
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {cycles.length === 0 && (
              <p className="text-surface-400 text-sm text-center py-4">No hay ciclos aún.</p>
            )}
            {cycles.map((c) => (
              <div key={c.$id} className="flex flex-col gap-3 px-4 py-3 rounded-xl border border-surface-100 bg-surface-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-surface-800">{c.name}</p>
                    <p className="text-xs text-surface-400 capitalize">{
                      c.status === 'active' ? 'Activo' : c.status === 'closed' ? 'Cerrado' : 'Borrador'
                    }</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.status !== 'active' && c.status !== 'closed' && (
                      <button
                        onClick={() => setStatus(c.$id, 'active')}
                        className="px-3 py-1 rounded-lg bg-primary-50 text-primary-600 border border-primary-100 text-xs font-medium hover:bg-primary-100 transition-colors"
                      >
                        Activar
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button
                        onClick={() => setStatus(c.$id, 'closed')}
                        className="px-3 py-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-100 text-xs font-medium hover:bg-amber-100 transition-colors"
                      >
                        Cerrar
                      </button>
                    )}
                    {c.status === 'active' && (
                      <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
                    )}
                  </div>
                </div>
                {(c.start_date || c.end_date) && (
                  <div className="text-[11px] text-surface-500 flex items-center gap-3 border-t border-surface-200 pt-2">
                    {c.start_date && <span>Inicio: {new Date(c.start_date).toLocaleDateString()}</span>}
                    {c.end_date && <span>Fin: {new Date(c.end_date).toLocaleDateString()}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
