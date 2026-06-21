import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { databases, fetchAllDocuments, Query } from '../lib/appwrite';
import { ID } from 'appwrite';
import { DB_ID, COLLECTIONS, SCORE_OPTIONS, CATEGORY_ORDER, CATEGORY_LABELS } from '../lib/constants';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import LoadingSpinner from '../components/LoadingSpinner';
import type { Employee, EvaluationCycle, Question } from '../types';

type Answers = Record<string, number>;

export default function EvaluationFormPage() {
  const { evaluatedId } = useParams<{ evaluatedId: string }>();
  const { employee: currentEmployee } = useAuth();
  const navigate = useNavigate();

  const [evaluatedEmployee, setEvaluatedEmployee] = useState<Employee | null>(null);
  const [cycle, setCycle] = useState<EvaluationCycle | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [error, setError] = useState('');

  const isSelf = evaluatedId === currentEmployee?.$id;

  useEffect(() => {
    if (currentEmployee && evaluatedId) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEmployee, evaluatedId]);

  async function loadData() {
    try {
      // Get evaluated employee profile
      const empDoc = await databases.getDocument(DB_ID, COLLECTIONS.EMPLOYEES, evaluatedId!);
      setEvaluatedEmployee(empDoc as unknown as Employee);

      // Get active cycle
      const cycleResult = await databases.listDocuments(DB_ID, COLLECTIONS.EVALUATION_CYCLES, [
        Query.equal('status', 'active'),
        Query.limit(1),
      ]);
      if (cycleResult.documents.length === 0) {
        navigate('/evaluaciones');
        return;
      }
      const activeCycle = cycleResult.documents[0] as unknown as EvaluationCycle;
      setCycle(activeCycle);

      // Check if already evaluated
      const existing = await databases.listDocuments(DB_ID, COLLECTIONS.RESPONSES, [
        Query.equal('evaluator_id', currentEmployee!.$id),
        Query.equal('evaluated_id', evaluatedId!),
        Query.equal('cycle_id', activeCycle.$id),
        Query.limit(1),
      ]);
      if (existing.total > 0) {
        setAlreadyDone(true);
        setLoading(false);
        return;
      }

      // Load questions sorted by order
      const allQuestions = await fetchAllDocuments<Question>(COLLECTIONS.QUESTIONS, [
        Query.orderAsc('order'),
      ]);
      setQuestions(allQuestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function setAnswer(questionId: string, rawValue: number, isInverted: boolean) {
    const score = isInverted ? 1.25 - rawValue : rawValue;
    setAnswers((prev) => ({ ...prev, [questionId]: score }));
  }

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

  async function handleSubmit() {
    if (!allAnswered || !cycle || !currentEmployee) return;
    setSubmitting(true);
    setError('');

    try {
      const evaluationType = isSelf ? 'self' : 'peer';
      for (const question of questions) {
        await databases.createDocument(DB_ID, COLLECTIONS.RESPONSES, ID.unique(), {
          cycle_id: cycle.$id,
          question_id: question.$id,
          evaluator_id: currentEmployee.$id,
          evaluated_id: evaluatedId,
          score: answers[question.$id],
          evaluation_type: evaluationType,
        });
      }
      navigate('/evaluaciones', { state: { submitted: true } });
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar. Intenta de nuevo.');
      setSubmitting(false);
    }
  }

  // Group questions by category
  const grouped = CATEGORY_ORDER.reduce<Record<string, Question[]>>((acc, cat) => {
    const catQuestions = questions.filter((q) => q.category === cat);
    if (catQuestions.length > 0) acc[cat] = catQuestions;
    return acc;
  }, {});

  if (loading) return <><Navbar /><LoadingSpinner fullPage /></>;

  if (alreadyDone) {
    return (
      <div className="min-h-screen bg-surface-100">
        <Navbar />
        <div className="max-w-lg mx-auto px-6 py-24 text-center">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-surface-800 mb-2">
            Evaluación completada
          </h2>
          <p className="text-surface-400 text-sm mb-6">
            Ya registraste tu evaluación para{' '}
            <strong className="text-surface-700">
              {isSelf ? 'ti mismo' : evaluatedEmployee?.name}
            </strong>{' '}
            en este ciclo.
          </p>
          <button
            onClick={() => navigate('/evaluaciones')}
            className="px-5 py-2.5 rounded-xl bg-surface-800 text-white text-sm font-medium hover:bg-surface-900 transition-colors"
          >
            Volver a mis evaluaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-100">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/evaluaciones')}
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-surface-700 transition-colors mb-4"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver
          </button>

          <h1 className="text-2xl font-bold text-surface-800">
            {isSelf ? 'Autoevaluación' : `Evaluando a ${evaluatedEmployee?.name}`}
          </h1>
          <p className="text-surface-400 text-sm mt-1">
            {isSelf
              ? 'Evalúa tu propio desempeño con honestidad y reflexión.'
              : `Evalúa el desempeño de ${evaluatedEmployee?.name} en el ciclo actual.`}
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-surface-200 px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-surface-400">Preguntas respondidas</p>
            <p className="text-sm font-semibold text-surface-800 mt-0.5">
              {answeredCount} de {totalQuestions}
            </p>
          </div>
          <div className="w-40 h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-300"
              style={{ width: `${totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-col gap-6">
          {Object.entries(grouped).map(([category, catQuestions]) => (
            <CategorySection
              key={category}
              category={category}
              questions={catQuestions}
              answers={answers}
              onAnswer={setAnswer}
            />
          ))}
        </div>

        {/* Submit */}
        <div className="mt-8 flex flex-col items-end gap-3">
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          {!allAnswered && answeredCount > 0 && (
            <p className="text-xs text-surface-400">
              Responde todas las preguntas para enviar.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-surface-200 disabled:text-surface-400 text-white text-sm font-semibold transition-all duration-200"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar evaluación'
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

function CategorySection({
  category,
  questions,
  answers,
  onAnswer,
}: {
  category: string;
  questions: Question[];
  answers: Answers;
  onAnswer: (id: string, rawValue: number, inverted: boolean) => void;
}) {
  const label = CATEGORY_LABELS[category] ?? category;
  const answered = questions.filter((q) => q.$id in answers).length;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      {/* Category header */}
      <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800">{label}</h3>
        <span className="text-xs text-surface-400">
          {answered}/{questions.length}
        </span>
      </div>

      {/* Questions */}
      <div className="divide-y divide-surface-50">
        {questions.map((q, idx) => (
          <QuestionRow
            key={q.$id}
            index={idx + 1}
            question={q}
            selectedRaw={
              // Reverse-compute raw display value
              q.$id in answers
                ? q.is_inverted
                  ? 1.25 - answers[q.$id]
                  : answers[q.$id]
                : undefined
            }
            onSelect={(rawValue) => onAnswer(q.$id, rawValue, q.is_inverted)}
          />
        ))}
      </div>
    </div>
  );
}

function QuestionRow({
  index,
  question,
  selectedRaw,
  onSelect,
}: {
  index: number;
  question: Question;
  selectedRaw: number | undefined;
  onSelect: (value: number) => void;
}) {
  return (
    <div className="px-6 py-5">
      <p className="text-sm text-surface-700 mb-4 leading-relaxed">
        <span className="text-surface-300 font-medium mr-2">{index}.</span>
        {question.text}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCORE_OPTIONS.map((opt) => {
          const isSelected = selectedRaw === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all duration-150 ${
                isSelected
                  ? 'bg-primary-500 border-primary-500 text-white shadow-sm'
                  : 'bg-surface-50 border-surface-200 text-surface-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-600'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
