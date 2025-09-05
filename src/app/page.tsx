export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">
            WhatsApp Clone
          </h1>
          <p className="text-xl text-gray-600">
            A modern messaging app built with Next.js and Firebase
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md mx-auto">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl font-bold">W</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800">
              Welcome to WhatsApp Clone
            </h2>
            <p className="text-gray-600">
              Sign in to start messaging with your friends and family.
            </p>
            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>Built with Next.js, Firebase, and Tailwind CSS</p>
        </div>
      </div>
    </main>
  )
}