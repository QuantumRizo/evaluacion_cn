import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { databases, fetchAllDocuments, Query } from '../lib/appwrite';
import { DB_ID, COLLECTIONS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Employee, EvaluationCycle } from '../types';

interface EmployeeWithStatus extends Employee {
  evaluated: boolean;
}

// Circular progress ring
function CircularProgress({ percent }: { percent: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="-rotate-90">
      <circle cx="30" cy="30" r={r} fill="none" stroke="#e8e8ed" strokeWidth="5" />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke="#416364"
        strokeWidth="5"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
    </svg>
  );
}

// Days remaining helper
function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getFirstName(name?: string) {
  return name?.split(' ')[0] ?? 'Colaborador';
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function EvaluationsPage() {
  const { employee: currentEmployee } = useAuth();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [selfDone, setSelfDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAllList, setShowAllList] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentEmployee) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployee]);

  async function loadData() {
    try {
      const cycleResult = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.EVALUATION_CYCLES,
        [Query.equal('status', 'active'), Query.limit(1)]
      );
      const activeCycle =
        cycleResult.documents.length > 0
          ? (cycleResult.documents[0] as unknown as EvaluationCycle)
          : null;
      setCycle(activeCycle);

      if (!activeCycle || !currentEmployee) return;

      const allEmployees = await fetchAllDocuments<Employee>(
        COLLECTIONS.EMPLOYEES,
        [Query.notEqual('$id', currentEmployee.$id)]
      );

      const myResponses = await fetchAllDocuments<{ evaluated_id: string }>(
        COLLECTIONS.RESPONSES,
        [
          Query.equal('evaluator_id', currentEmployee.$id),
          Query.equal('cycle_id', activeCycle.$id),
        ]
      );

      const evaluatedIds = new Set(myResponses.map((r) => r.evaluated_id));
      setSelfDone(evaluatedIds.has(currentEmployee.$id));

      setEmployees(
        allEmployees.map((e) => ({ ...e, evaluated: evaluatedIds.has(e.$id) }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPeer = employees.length;
  const completedPeer = employees.filter((e) => e.evaluated).length;
  const totalTasks = totalPeer + 1; // +1 for self
  const completedTasks = completedPeer + (selfDone ? 1 : 0);
  const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const pending = filtered.filter((e) => !e.evaluated);
  const completed = filtered.filter((e) => e.evaluated);
  const daysLeft = daysUntil(cycle?.end_date);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100 md:pl-64 flex items-center justify-center">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 md:pl-64">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header greeting ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-800 tracking-tight">
            {getGreeting()}, {getFirstName(currentEmployee?.name)}
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {cycle ? (
              <>
                <span className="font-medium text-surface-600">{cycle.name}</span>
                {cycle.start_date && (
                  <span>
                    &nbsp;·&nbsp;
                    {new Date(cycle.start_date).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
                  </span>
                )}
              </>
            ) : (
              'No hay un ciclo de evaluación activo.'
            )}
          </p>
        </div>

        {!cycle ? (
          /* ── No active cycle ── */
          <div className="text-center py-20 bg-white rounded-2xl border border-surface-200">
            <svg className="w-10 h-10 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-surface-500 font-medium text-sm">Sin ciclo activo</p>
            <p className="text-surface-400 text-xs mt-1">El administrador aún no ha iniciado un ciclo de evaluación.</p>
          </div>
        ) : (
          <>
            {/* ── Progress card ── */}
            <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-6 shadow-xs">
              <p className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
                Tu progreso en esta ronda
              </p>
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Percent + bar */}
                <div className="flex-1">
                  <p className="text-4xl font-bold text-surface-800 mb-2">{percent}%</p>
                  <p className="text-xs text-surface-400 mb-3">
                    {completedTasks} de {totalTasks} evaluaciones completadas
                  </p>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-700"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-8 md:gap-10 shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-500">{completedTasks}</p>
                    <p className="text-xs text-surface-400 mt-0.5">Completadas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{totalTasks - completedTasks}</p>
                    <p className="text-xs text-surface-400 mt-0.5">Pendientes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-surface-400">0</p>
                    <p className="text-xs text-surface-400 mt-0.5">En progreso</p>
                  </div>
                </div>

                {/* Deadline */}
                {cycle.end_date && (
                  <div className="flex items-center gap-3 bg-surface-100 rounded-xl px-5 py-4 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                      <svg className="w-4.5 h-4.5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-surface-600 uppercase tracking-wide">Cierre de la ronda</p>
                      <p className="text-sm font-semibold text-surface-800 mt-0.5">{formatDate(cycle.end_date)}</p>
                      {daysLeft !== null && (
                        <p className="text-xs text-surface-400 mt-0.5">
                          {daysLeft === 0 ? 'Vence hoy' : `Quedan ${daysLeft} días`}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Action cards ── */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Self-evaluation card */}
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-xs flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Tu Tarea</p>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-surface-800">Autoevaluación</h2>
                      <p className="text-sm text-surface-400 mt-1 leading-relaxed">
                        Evalúa tu propio desempeño<br />en el ciclo actual.
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mini progress */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <CircularProgress percent={selfDone ? 100 : 0} />
                    <span className="absolute text-[10px] font-bold text-surface-700">{selfDone ? '100%' : '0%'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">
                      {selfDone ? 'Completada' : 'Aún no has comenzado'}
                    </p>
                    <p className="text-xs text-surface-400">Tiempo estimado: 15 min</p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => !selfDone && navigate(`/evaluar/${currentEmployee!.$id}`)}
                  disabled={selfDone}
                  className={`mt-auto w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selfDone
                      ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                      : 'bg-surface-800 text-white hover:bg-surface-700 cursor-pointer'
                  }`}
                >
                  {selfDone ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Completada
                    </>
                  ) : (
                    <>
                      Comenzar autoevaluación
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Peer evaluations card */}
              <div className="bg-white rounded-2xl border border-surface-200 p-6 shadow-xs flex flex-col gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surface-400 mb-2">Tu Tarea</p>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-surface-800">Evaluar colaboradores</h2>
                      <p className="text-sm text-surface-400 mt-1 leading-relaxed">
                        Evalúa el desempeño de las personas<br />que colaboran contigo.
                      </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-surface-100 flex items-center justify-center shrink-0">
                      <svg className="w-7 h-7 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Mini progress */}
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <CircularProgress percent={totalPeer > 0 ? Math.round((completedPeer / totalPeer) * 100) : 0} />
                    <span className="absolute text-[10px] font-bold text-surface-700">
                      {totalPeer > 0 ? Math.round((completedPeer / totalPeer) * 100) : 0}%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">
                      {completedPeer === totalPeer && totalPeer > 0
                        ? 'Todas completadas'
                        : `${totalPeer - completedPeer} pendientes por evaluar`}
                    </p>
                    <p className="text-xs text-surface-400">Tiempo estimado por persona: 10 min</p>
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => {
                    setShowAllList(true);
                    setTimeout(() => {
                      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 50);
                  }}
                  disabled={completedPeer === totalPeer && totalPeer > 0}
                  className={`mt-auto w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    completedPeer === totalPeer && totalPeer > 0
                      ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                      : 'bg-surface-800 text-white hover:bg-surface-700 cursor-pointer'
                  }`}
                >
                  {completedPeer === totalPeer && totalPeer > 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Todas completadas
                    </>
                  ) : (
                    <>
                      Comenzar evaluaciones
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* ── "See all" shortcut ── */}
            <div ref={listRef} />
            <button
              onClick={() => setShowAllList((v) => !v)}
              className="w-full bg-white rounded-2xl border border-surface-200 shadow-xs px-6 py-4 flex items-center gap-4 hover:border-primary-300 transition-colors duration-200 mb-2"
            >
              <div className="w-9 h-9 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-surface-800">Ver todas las evaluaciones</p>
                <p className="text-xs text-surface-400">Revisa y filtra todas las personas que debes evaluar.</p>
              </div>
              <div className="flex items-center gap-1.5 text-primary-500 font-semibold text-sm shrink-0">
                <span>{showAllList ? 'Ocultar' : 'Ver todas'}</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showAllList ? 'rotate-90' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* ── Full employee list (expandable) ── */}
            {showAllList && (
              <div className="bg-white rounded-2xl border border-surface-200 shadow-xs overflow-hidden mt-0">
                {/* Search bar inside */}
                <div className="px-5 py-4 border-b border-surface-200 flex items-center gap-3">
                  <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Buscar colaborador o área..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-surface-200 bg-surface-100 text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300"
                    />
                  </div>
                  <span className="text-xs text-surface-400 shrink-0">
                    {completedPeer} / {totalPeer} completadas
                  </span>
                </div>

                {/* Pending section */}
                {pending.length > 0 && (
                  <div>
                    <div className="px-5 py-2.5 bg-surface-100 border-b border-surface-200">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                        Pendientes · {pending.length}
                      </span>
                    </div>
                    <div className="divide-y divide-surface-200">
                      {pending.map((emp) => (
                        <EmployeeRow
                          key={emp.$id}
                          employee={emp}
                          done={false}
                          onClick={() => navigate(`/evaluar/${emp.$id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed section */}
                {completed.length > 0 && (
                  <div>
                    <div className="px-5 py-2.5 bg-surface-100 border-b border-surface-200">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-green-600">
                        Completadas · {completed.length}
                      </span>
                    </div>
                    <div className="divide-y divide-surface-200">
                      {completed.map((emp) => (
                        <EmployeeRow key={emp.$id} employee={emp} done onClick={() => {}} />
                      ))}
                    </div>
                  </div>
                )}

                {filtered.length === 0 && (
                  <div className="text-center py-10 text-surface-400 text-sm">
                    No se encontraron colaboradores.
                  </div>
                )}
              </div>
            )}

            {/* ── Privacy tip ── */}
            <div className="flex items-center justify-between mt-4 px-1">
              <div className="flex items-center gap-2 text-surface-400 text-xs">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tip: Puedes usar los filtros y búsqueda para encontrar evaluaciones específicas.</span>
              </div>
              {!showAllList && (
                <button
                  onClick={() => setShowAllList(true)}
                  className="text-xs font-semibold text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors shrink-0"
                >
                  Ver todas las evaluaciones
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

/* ── Sub-components ── */

function EmployeeRow({
  employee,
  done,
  onClick,
}: {
  employee: Employee;
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={done ? undefined : onClick}
      disabled={done}
      className={`w-full flex items-center justify-between px-5 py-3.5 transition-colors duration-150 text-left ${
        done
          ? 'opacity-60 cursor-default'
          : 'hover:bg-surface-100 cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${
            done ? 'bg-green-50 text-green-600' : 'bg-primary-50 text-primary-600'
          }`}
        >
          {employee.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-surface-800">{employee.name}</p>
          {employee.department && (
            <p className="text-xs text-surface-400">{employee.department}</p>
          )}
        </div>
      </div>
      {done ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-medium shrink-0">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Completada
        </span>
      ) : (
        <svg className="w-4 h-4 text-surface-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}
