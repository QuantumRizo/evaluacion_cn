import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { databases, fetchAllDocuments, Query } from '../../lib/appwrite';
import { ID } from 'appwrite';
import { DB_ID, COLLECTIONS } from '../../lib/constants';
import Navbar from '../../components/Navbar';
import LoadingSpinner from '../../components/LoadingSpinner';
import type { Employee, EvaluationCycle, EvaluationAssignment } from '../../types';

export default function AdminAssignmentsPage() {
  const navigate = useNavigate();
  const { cycleId } = useParams();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employee');

  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [evaluatedEmployee, setEvaluatedEmployee] = useState<Employee | null>(null);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<Set<string>>(new Set());
  const [initialAssignments, setInitialAssignments] = useState<EvaluationAssignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cycleId || !employeeId) {
      navigate('/admin');
      return;
    }
    loadData();
  }, [cycleId, employeeId, navigate]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      // Load Cycle
      const cycleDoc = await databases.getDocument(DB_ID, COLLECTIONS.EVALUATION_CYCLES, cycleId!);
      setCycle(cycleDoc as unknown as EvaluationCycle);

      // Load Evaluated Employee
      const empDoc = await databases.getDocument(DB_ID, COLLECTIONS.EMPLOYEES, employeeId!);
      setEvaluatedEmployee(empDoc as unknown as Employee);

      // Load all potential peer evaluators (excluding admins)
      const emps = await fetchAllDocuments<Employee>(COLLECTIONS.EMPLOYEES, [
        Query.equal('role', 'employee'),
        // Optionally, we could exclude the evaluated employee so they don't peer-review themselves,
        // but it's simpler to let the admin just not check their name. We can filter it here:
        Query.notEqual('$id', employeeId!),
      ]);
      setAllEmployees(emps);

      // Load current assignments
      const assignments = await fetchAllDocuments<EvaluationAssignment>(COLLECTIONS.EVALUATION_ASSIGNMENTS, [
        Query.equal('cycle_id', cycleId!),
        Query.equal('evaluated_id', employeeId!),
      ]);
      
      setInitialAssignments(assignments);
      setSelectedEvaluatorIds(new Set(assignments.map(a => a.evaluator_id)));

    } catch (err) {
      console.error(err);
      setError('Error al cargar la información. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  }

  function toggleEvaluator(id: string) {
    const next = new Set(selectedEvaluatorIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedEvaluatorIds(next);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      // 1. Delete previous assignments for this employee in this cycle
      for (const assignment of initialAssignments) {
        await databases.deleteDocument(DB_ID, COLLECTIONS.EVALUATION_ASSIGNMENTS, assignment.$id);
      }

      // 2. Create new assignments
      const newAssignments: EvaluationAssignment[] = [];
      for (const evaluatorId of Array.from(selectedEvaluatorIds)) {
        const doc = await databases.createDocument(
          DB_ID,
          COLLECTIONS.EVALUATION_ASSIGNMENTS,
          ID.unique(),
          {
            cycle_id: cycleId,
            evaluated_id: employeeId,
            evaluator_id: evaluatorId,
          }
        );
        newAssignments.push(doc as unknown as EvaluationAssignment);
      }

      setInitialAssignments(newAssignments);
      navigate('/admin');
    } catch (err) {
      console.error(err);
      setError('Error al guardar las asignaciones.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-100">
        <Navbar />
        <LoadingSpinner />
      </div>
    );
  }

  if (!cycle || !evaluatedEmployee) {
    return (
      <div className="min-h-screen bg-surface-100">
        <Navbar />
        <div className="max-w-3xl mx-auto mt-10 px-6 text-center">
          <p className="text-surface-500">No se encontró la información solicitada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto w-full px-6 py-10 flex-grow flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-surface-500 hover:text-surface-800 transition-colors mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </button>
          <h1 className="text-2xl font-bold text-surface-800 mb-1">
            Asignar Evaluadores
          </h1>
          <p className="text-surface-500 text-sm">
            Ciclo: <span className="font-semibold">{cycle.name}</span>
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-2xl border border-surface-200 p-6 mb-8 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-primary-600">
              {evaluatedEmployee.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-800">
              Evaluado: {evaluatedEmployee.name}
            </h2>
            <p className="text-surface-500 text-sm">
              {evaluatedEmployee.department || 'Sin área'} — Selecciona quiénes de la lista de abajo deberán evaluar su desempeño.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
            {error}
          </div>
        )}

        {/* List of Peers */}
        <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden shadow-sm mb-8 flex-grow">
          <div className="px-6 py-4 border-b border-surface-100 bg-surface-50 flex justify-between items-center">
            <h3 className="font-semibold text-surface-800 text-sm">Compañeros Disponibles</h3>
            <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
              {selectedEvaluatorIds.size} seleccionados
            </span>
          </div>
          <div className="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
            {allEmployees.length === 0 ? (
              <p className="p-6 text-center text-sm text-surface-500">
                No hay otros empleados registrados en el sistema.
              </p>
            ) : (
              allEmployees.map((emp) => {
                const isSelected = selectedEvaluatorIds.has(emp.$id);
                return (
                  <label
                    key={emp.$id}
                    className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-surface-50 ${isSelected ? 'bg-primary-50/30' : ''}`}
                  >
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleEvaluator(emp.$id)}
                        className="peer sr-only"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary-500 border-primary-500' : 'bg-white border-surface-300'}`}>
                        {isSelected && (
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-surface-800">{emp.name}</p>
                      {emp.department && <p className="text-xs text-surface-400">{emp.department}</p>}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 sticky bottom-6">
          <button
            onClick={() => navigate('/admin')}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl border border-surface-200 bg-white text-surface-600 text-sm font-medium hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2 shadow-md shadow-primary-500/20"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Asignaciones'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
