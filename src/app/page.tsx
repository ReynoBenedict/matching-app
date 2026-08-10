export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">BPS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            BPS Data Matching System
          </h1>
          <p className="text-gray-600">
            Sistem Pencocokan Data<br />
            Badan Pusat Statistik Kota Malang
          </p>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <h3 className="font-semibold text-green-800 mb-1">Project Foundation</h3>
            <p className="text-sm text-green-600">Phase 1</p>
          </div>
          
          <div className="text-left space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Next.js + TypeScript</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Tailwind CSS</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Drizzle ORM</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>PostgreSQL Ready</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Docker Configuration</span>
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 border-t pt-4">
          <p>Technical foundation ready for business logic implementation</p>
          <p className="mt-1">Authentication, dataset management, and matching features will be implemented in later phases</p>
        </div>
      </div>
    </div>
  );
}
