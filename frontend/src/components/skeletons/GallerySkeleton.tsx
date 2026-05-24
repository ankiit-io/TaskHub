export default function GallerySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="border border-white/10 rounded-2xl overflow-hidden animate-pulse"
        >
          <div className="w-full h-64 bg-white/10"></div>

          <div className="p-4 space-y-3">
            <div className="h-5 w-32 bg-white/10 rounded"></div>

            <div className="flex gap-2">
              <div className="h-10 w-28 bg-white/10 rounded-lg"></div>

              <div className="h-10 w-20 bg-white/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
