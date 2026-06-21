export default function LoadingSpinner({ fullPage = false }: { fullPage?: boolean }) {
  if (fullPage) {
    return (
      <div className="min-h-screen bg-surface-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-surface-200 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-surface-400 text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-surface-200 border-t-primary-500 rounded-full animate-spin" />
    </div>
  );
}
