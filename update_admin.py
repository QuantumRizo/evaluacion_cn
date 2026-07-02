import re
import os

dashboard_path = 'src/pages/admin/AdminDashboard.tsx'
with open(dashboard_path, 'r') as f:
    dashboard_content = f.read()

# 1. Update Tab type
dashboard_content = dashboard_content.replace(
    "type Tab = 'ciclos' | 'resultados';",
    "type Tab = 'ciclos' | 'progreso' | 'resultados';"
)

# 2. Update state in AdminDashboard
state_injection = """
  // Results Tab state
  const [selectedResultCycleId, setSelectedResultCycleId] = useState<string>('');
  const [resultsStats, setResultsStats] = useState<EmployeeStats[]>([]);

  // Progress Tab state
  const [selectedProgressCycleId, setSelectedProgressCycleId] = useState<string>('');
"""
dashboard_content = dashboard_content.replace(
    "  // Results Tab state\n  const [selectedResultCycleId, setSelectedResultCycleId] = useState<string>('');\n  const [resultsStats, setResultsStats] = useState<EmployeeStats[]>([]);",
    state_injection
)

# 3. Update loadData to initialize selectedProgressCycleId
load_data_injection = """
      if (!selectedResultCycleId && cycles.length > 0) {
        setSelectedResultCycleId(cycles[0].$id);
      }
      if (!selectedProgressCycleId && cycles.length > 0) {
        setSelectedProgressCycleId(cycles[0].$id);
      }
"""
dashboard_content = dashboard_content.replace(
    "      if (!selectedResultCycleId && cycles.length > 0) {\n        setSelectedResultCycleId(cycles[0].$id);\n      }",
    load_data_injection
)

# 4. Update tabs array
tabs_injection = """    {
      id: 'ciclos', label: 'Gestión de Ciclos',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
    },
    {
      id: 'progreso', label: 'Progreso y Comentarios',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
    {
      id: 'resultados', label: 'Resultados por Ciclo',"""
dashboard_content = dashboard_content.replace(
    "    {\n      id: 'ciclos', label: 'Gestión de Ciclos',\n      icon: <svg className=\"w-4 h-4\" fill=\"none\" viewBox=\"0 0 24 24\" stroke=\"currentColor\" strokeWidth={2}><path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\" /></svg>,\n    },\n    {\n      id: 'resultados', label: 'Resultados por Ciclo',",
    tabs_injection
)

# 5. Render ProgressTab
render_injection = """
            {activeTab === 'ciclos' && (
              <CyclesTab cycles={allCycles} allEmployees={allEmployees} onRefresh={loadData} />
            )}
            {activeTab === 'progreso' && (
              <ProgressTab 
                cycles={allCycles}
                selectedCycleId={selectedProgressCycleId}
                onSelectCycle={setSelectedProgressCycleId}
                allEmployees={allEmployees} 
              />
            )}
            {activeTab === 'resultados' && ("""
dashboard_content = dashboard_content.replace(
    "            {activeTab === 'ciclos' && (\n              <CyclesTab cycles={allCycles} allEmployees={allEmployees} onRefresh={loadData} />\n            )}\n            {activeTab === 'resultados' && (",
    render_injection
)

# 6. Append ProgressTab component
progress_tab_code = """
// ─── TAB 3: Progreso ─────────────────────────────────────────────────────────

function ProgressTab({
  cycles,
  selectedCycleId,
  onSelectCycle,
  allEmployees,
}: {
  cycles: EvaluationCycle[];
  selectedCycleId: string;
  onSelectCycle: (id: string) => void;
  allEmployees: Employee[];
}) {
  const [assignments, setAssignments] = useState<EvaluationAssignment[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [comments, setComments] = useState<any[]>([]); // EvaluationComment
  const [loading, setLoading] = useState(true);
  const [selectedEvaluatedId, setSelectedEvaluatedId] = useState<string | null>(null);

  const selectedCycle = cycles.find(c => c.$id === selectedCycleId);

  useEffect(() => {
    async function loadProgress() {
      if (!selectedCycleId) return;
      setLoading(true);
      try {
        const [assigns, resps, comms] = await Promise.all([
          fetchAllDocuments<EvaluationAssignment>(COLLECTIONS.EVALUATION_ASSIGNMENTS, [Query.equal('cycle_id', selectedCycleId)]),
          fetchAllDocuments<Response>(COLLECTIONS.RESPONSES, [Query.equal('cycle_id', selectedCycleId)]),
          fetchAllDocuments<any>(COLLECTIONS.EVALUATION_COMMENTS, [Query.equal('cycle_id', selectedCycleId)]),
        ]);
        setAssignments(assigns);
        setResponses(resps);
        setComments(comms);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProgress();
  }, [selectedCycleId]);

  if (cycles.length === 0) {
    return <div className="text-center p-10 text-surface-500">No hay ciclos creados.</div>;
  }

  // Find all employees being evaluated in this cycle
  const participants = allEmployees.filter(emp => assignments.some(a => a.evaluated_id === emp.$id));

  // Evaluated details
  let evaluatedAssignments: EvaluationAssignment[] = [];
  let evaluatedEmployee = null;
  if (selectedEvaluatedId) {
    evaluatedAssignments = assignments.filter(a => a.evaluated_id === selectedEvaluatedId);
    evaluatedEmployee = allEmployees.find(e => e.$id === selectedEvaluatedId);
  }

  return (
    <div>
      {/* Dropdown to select cycle */}
      <div className="mb-6 flex items-center gap-4 bg-white p-4 rounded-2xl border border-surface-200">
        <label className="text-sm font-semibold text-surface-700">Viendo progreso del ciclo:</label>
        <select 
          value={selectedCycleId} 
          onChange={(e) => { onSelectCycle(e.target.value); setSelectedEvaluatedId(null); }}
          className="bg-surface-50 border border-surface-200 text-surface-800 text-sm rounded-xl focus:ring-primary-500 focus:border-primary-500 block px-4 py-2 font-medium min-w-[250px]"
        >
          {cycles.map(c => <option key={c.$id} value={c.$id}>{c.name} ({c.status})</option>)}
        </select>
        {selectedCycle && <StatusBadge status={selectedCycle.status} />}
      </div>

      {loading ? <div className="p-10 flex justify-center"><LoadingSpinner /></div> : (
        participants.length === 0 ? (
          <div className="bg-white rounded-2xl border border-surface-200 p-16 text-center">
            <p className="text-surface-600 font-medium">Nadie está participando en este ciclo aún.</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row h-[600px] border border-surface-200 rounded-2xl overflow-hidden bg-white">
            {/* Left: Participants List */}
            <div className="w-full md:w-1/3 flex flex-col h-1/2 md:h-full border-b md:border-b-0 md:border-r border-surface-200">
              <div className="p-4 border-b border-surface-100 bg-surface-50 shrink-0">
                <h3 className="font-semibold text-surface-800">Evaluados en el ciclo</h3>
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {participants.map(emp => {
                  const empAssignments = assignments.filter(a => a.evaluated_id === emp.$id);
                  // Count completed evaluators for this employee
                  const completedEvaluators = new Set(responses.filter(r => r.evaluated_id === emp.$id).map(r => r.evaluator_id)).size;
                  const isComplete = completedEvaluators >= empAssignments.length && empAssignments.length > 0;
                  const isSelected = selectedEvaluatedId === emp.$id;
                  
                  return (
                    <button
                      key={emp.$id}
                      onClick={() => setSelectedEvaluatedId(emp.$id)}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between transition-all ${isSelected ? 'bg-primary-50 border border-primary-200 shadow-sm' : 'hover:bg-surface-50 border border-transparent'}`}
                    >
                      <div className="truncate pr-2">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-primary-800' : 'text-surface-700'}`}>{emp.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-surface-500 font-medium">{completedEvaluators}/{empAssignments.length}</span>
                        {isComplete ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Evaluators for selected */}
            <div className="w-full md:w-2/3 flex flex-col h-1/2 md:h-full bg-surface-50">
              {!selectedEvaluatedId || !evaluatedEmployee ? (
                <div className="m-auto text-center p-8">
                  <div className="w-12 h-12 bg-surface-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <p className="text-surface-500 text-sm">Selecciona un evaluado a la izquierda para ver su progreso.</p>
                </div>
              ) : (
                <>
                  <div className="p-4 border-b border-surface-200 bg-white shrink-0">
                    <h3 className="font-semibold text-surface-800">Evaluadores de: <span className="text-primary-600">{evaluatedEmployee.name}</span></h3>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4 space-y-4">
                    {evaluatedAssignments.map(assignment => {
                      const evaluator = allEmployees.find(e => e.$id === assignment.evaluator_id);
                      if (!evaluator) return null;
                      
                      const hasCompleted = responses.some(r => r.evaluated_id === selectedEvaluatedId && r.evaluator_id === evaluator.$id);
                      const commentDoc = comments.find(c => c.evaluated_id === selectedEvaluatedId && c.evaluator_id === evaluator.$id);
                      const isSelf = evaluator.$id === selectedEvaluatedId;

                      return (
                        <div key={assignment.$id} className="bg-white rounded-xl border border-surface-200 p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasCompleted ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                {hasCompleted ? (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-surface-800">
                                  {evaluator.name}
                                  {isSelf && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-primary-100 text-primary-700">Autoevaluación</span>}
                                </p>
                                <p className="text-xs text-surface-500">{evaluator.position ?? 'Sin puesto'} • {evaluator.department ?? 'Sin área'}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${hasCompleted ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {hasCompleted ? 'Completó' : 'Pendiente'}
                            </span>
                          </div>
                          
                          {hasCompleted && (
                            <div className="mt-3 pl-11">
                              {commentDoc ? (
                                <div className="bg-surface-50 border border-surface-100 rounded-lg p-3 relative">
                                  <svg className="w-4 h-4 text-surface-300 absolute top-3 left-3" fill="currentColor" viewBox="0 0 32 32">
                                    <path d="M10 8c-3.3 0-6 2.7-6 6v10h10V14H8c0-1.1.9-2 2-2h1.5V8H10zm16 0c-3.3 0-6 2.7-6 6v10h10V14h-6c0-1.1.9-2 2-2h1.5V8H26z" />
                                  </svg>
                                  <p className="text-sm text-surface-700 pl-6 leading-relaxed whitespace-pre-wrap">{commentDoc.comment}</p>
                                </div>
                              ) : (
                                <p className="text-xs text-surface-400 italic">Sin comentario adicional.</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
}
"""
dashboard_content += "\n" + progress_tab_code

with open(dashboard_path, 'w') as f:
    f.write(dashboard_content)

print("Dashboard updated")
