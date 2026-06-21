import { useEffect, useState } from 'react';
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

export default function EvaluationsPage() {
  const { employee: currentEmployee } = useAuth();
  const navigate = useNavigate();

  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [selfDone, setSelfDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentEmployee) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployee]);

  async function loadData() {
    try {
      // 1. Get active cycle
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

      // 2. Get all employees except self
      const allEmployees = await fetchAllDocuments<Employee>(
        COLLECTIONS.EMPLOYEES,
        [Query.notEqual('$id', currentEmployee.$id)]
      );

      // 3. Get all responses submitted BY this evaluator in this cycle
      const myResponses = await fetchAllDocuments<{ evaluated_id: string }>(
        COLLECTIONS.RESPONSES,
        [
          Query.equal('evaluator_id', currentEmployee.$id),
          Query.equal('cycle_id', activeCycle.$id),
        ]
      );

      const evaluatedIds = new Set(myResponses.map((r) => r.evaluated_id));

      // 4. Check self-evaluation
      setSelfDone(evaluatedIds.has(currentEmployee.$id));

      // 5. Map employees with completion status
      setEmployees(
        allEmployees
          .filter((e) => e.role === 'employee') // exclude other admins
          .map((e) => ({ ...e, evaluated: evaluatedIds.has(e.$id) }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const pending = filtered.filter((e) => !e.evaluated);
  const completed = filtered.filter((e) => e.evaluated);

  return (
    <div className="min-h-screen bg-surface-100 md:pl-64">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-surface-800">
            Mis Evaluaciones
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {cycle
              ? `Ciclo activo: ${cycle.name}`
              : 'No hay un ciclo de evaluación activo en este momento.'}
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : !cycle ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-surface-200">
            <svg className="w-10 h-10 text-surface-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-surface-500 font-medium text-sm">Sin ciclo activo</p>
            <p className="text-surface-400 text-xs mt-1">
              El administrador aún no ha iniciado un ciclo de evaluación.
            </p>
          </div>
        ) : (
          <>
            {/* Privacy Notification Banner */}
            <div className="bg-white rounded-2xl border border-primary-100 p-5 mb-6 flex gap-4 items-start shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-surface-800">Compromiso de Privacidad y Confidencialidad</h3>
                <p className="text-xs text-surface-500 leading-relaxed mt-1">
                  Tu participación es clave y totalmente segura. El sistema procesa las calificaciones de manera colectiva y consolidada, garantizando que ninguna respuesta individual a compañeros o líderes sea revelada o asociada a tu nombre.
                </p>
              </div>
            </div>


            {/* Self-evaluation card */}
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-3 rounded-full bg-indigo-500"></span>
                Autoevaluación
              </h2>
              <button
                onClick={() =>
                  !selfDone && navigate(`/evaluar/${currentEmployee!.$id}`)
                }
                disabled={selfDone}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border border-l-4 transition-all duration-200 text-left ${
                  selfDone
                    ? 'bg-white border-surface-200 border-l-green-500 cursor-default'
                    : 'bg-white border-surface-200 border-l-indigo-600 hover:border-indigo-400 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selfDone ? 'bg-green-50' : 'bg-indigo-50'}`}>
                    <svg className={`w-4.5 h-4.5 ${selfDone ? 'text-green-600' : 'text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-800">
                      Mi Autoevaluación
                    </p>
                    <p className="text-xs text-surface-400 mt-0.5">
                      Evalúa tu propio desempeño en el ciclo actual
                    </p>
                  </div>
                </div>
                {selfDone ? (
                  <StatusBadge done />
                ) : (
                  <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Peers */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-primary-600 flex items-center gap-2">
                  <span className="w-1.5 h-3 rounded-full bg-primary-500"></span>
                  Evaluar a otros empleados ({employees.length})
                </h2>
                {/* Search */}
                <div className="relative">
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-surface-200 bg-white text-surface-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-300 w-40"
                  />
                </div>
              </div>

              {pending.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {pending.map((emp) => (
                    <EmployeeRow
                      key={emp.$id}
                      employee={emp}
                      done={false}
                      onClick={() => navigate(`/evaluar/${emp.$id}`)}
                    />
                  ))}
                </div>
              )}

              {completed.length > 0 && (
                <div className="flex flex-col gap-2">
                  {completed.map((emp) => (
                    <EmployeeRow
                      key={emp.$id}
                      employee={emp}
                      done
                      onClick={() => {}}
                    />
                  ))}
                </div>
              )}

              {filtered.length === 0 && (
                <div className="text-center py-10 text-surface-400 text-sm">
                  No se encontraron empleados para evaluar.
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

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
      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border border-l-4 bg-white transition-all duration-200 text-left ${
        done
          ? 'border-surface-200 border-l-green-500 cursor-default opacity-65'
          : 'border-surface-200 border-l-primary-500 hover:border-primary-300 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          done ? 'bg-green-50' : 'bg-primary-50'
        }`}>
          <span className={`text-xs font-semibold ${
            done ? 'text-green-600' : 'text-primary-600'
          }`}>
            {employee.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-surface-800">{employee.name}</p>
          {employee.department && (
            <p className="text-xs text-surface-400">{employee.department}</p>
          )}
        </div>
      </div>
      {done ? (
        <StatusBadge done />
      ) : (
        <svg className="w-4 h-4 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      )}
    </button>
  );
}

function StatusBadge({ done }: { done: boolean }) {
  if (done) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-600 text-xs font-medium">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Completada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-xs font-medium">
      Pendiente
    </span>
  );
}
