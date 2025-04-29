// Custom loading spinner component
const LoadingSpinner = () => (
    <div className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
        <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-400 opacity-30"></div>
        </div>
        <p className="mt-4 text-emerald-700 font-medium">Loading...</p>
    </div>
);

export default LoadingSpinner;