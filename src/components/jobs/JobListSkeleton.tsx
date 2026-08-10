// Loading skeleton component
export default function JobListSkeleton({
  fillHeight = false,
}: {
  fillHeight?: boolean;
}) {
  return (
    <div
      className={`bg-earth-50 rounded-lg overflow-hidden border border-earth-200 shadow-sm animate-pulse ${
        fillHeight ? "h-full" : "h-[calc(100vh-13rem)]"
      }`}
    >
      <div className="flex flex-col md:flex-row h-full">
        {/* Left skeleton */}
        <div className="w-full md:w-2/5 bg-earth-50 border-r border-earth-200">
          <div className="p-4 border-b border-earth-200">
            <div className="h-6 bg-earth-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-earth-200 rounded w-1/4"></div>
          </div>
          <div className="divide-y divide-earth-200">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="h-5 bg-earth-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-earth-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-earth-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
        {/* Right skeleton */}
        <div className="w-full md:w-3/5 bg-earth-50">
          <div className="p-6 border-b border-earth-200">
            <div className="h-8 bg-earth-200 rounded w-2/3 mb-3"></div>
            <div className="flex gap-2 mb-4">
              <div className="h-5 bg-earth-200 rounded w-1/4"></div>
              <div className="h-5 bg-earth-200 rounded w-1/4"></div>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="h-10 bg-earth-200 rounded w-32"></div>
              <div className="h-10 bg-earth-200 rounded w-32"></div>
              <div className="h-10 bg-earth-200 rounded w-32"></div>
            </div>
          </div>
          <div className="p-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-earth-200 rounded w-full mb-3"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
