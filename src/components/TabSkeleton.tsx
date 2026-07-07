interface TabSkeletonProps {
  isNight: boolean;
}

export default function TabSkeleton({ isNight }: TabSkeletonProps) {
  return (
    <div className="w-full animate-pulse space-y-4 py-4" aria-hidden>
      <div className={`h-8 w-48 rounded-lg ${isNight ? 'bg-white/5' : 'bg-stone-200/60'}`} />
      <div className={`h-64 w-full rounded-2xl ${isNight ? 'bg-white/5' : 'bg-stone-200/40'}`} />
      <div className={`h-40 w-full rounded-2xl ${isNight ? 'bg-white/5' : 'bg-stone-200/30'}`} />
    </div>
  );
}
