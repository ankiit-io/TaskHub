export default function TaskCardSkeleton() {
  return (
    <div className="border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="w-full h-56 bg-white/10 rounded-xl mb-4"></div>

      <div className="h-7 w-52 bg-white/10 rounded-lg mb-4"></div>

      <div className="space-y-2">
        <div className="h-4 bg-white/10 rounded"></div>
        <div className="h-4 w-4/5 bg-white/10 rounded"></div>
      </div>

      <div className="mt-5 h-10 w-32 bg-white/10 rounded-full"></div>
    </div>
  );
}
