import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';
import { CheckCircle, Zap, Users, BarChart3 } from 'lucide-react';

export function Landing() {
  return (
    <>
      {/* Redirect to dashboard if signed in */}
      <SignedIn>
        <Navigate to="/dashboard" replace />
      </SignedIn>
      
      {/* Landing page for signed out users */}
      <SignedOut>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
          {/* Hero Section */}
          <div className="relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
              <div className="relative z-10 pb-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
                <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
                  <div className="sm:text-center lg:text-left">
                    <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                      <span className="block xl:inline">Supercharge your</span>{' '}
                      <span className="block text-blue-600 xl:inline">productivity</span>
                    </h1>
                    <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                      TaskFlow AI helps you manage tasks intelligently with AI-powered insights, real-time collaboration, and powerful analytics.
                    </p>
                    <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                      <div className="rounded-md shadow">
                        <SignInButton mode="modal">
                          <button className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-colors">
                            Get started for free
                          </button>
                        </SignInButton>
                      </div>
                    </div>
                  </div>
                </main>
              </div>
            </div>
            <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
              <div className="h-56 w-full bg-gradient-to-r from-blue-500 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
                <div className="text-white text-6xl">
                  <Zap className="w-32 h-32" />
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="py-12 bg-white dark:bg-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="lg:text-center">
                <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
                <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                  Everything you need to stay productive
                </p>
                <p className="mt-4 max-w-2xl text-xl text-gray-500 dark:text-gray-300 lg:mx-auto">
                  Powerful features designed to help you and your team accomplish more.
                </p>
              </div>

              <div className="mt-10">
                <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                  <div className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Smart Task Management</p>
                    <p className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">
                      AI-powered task prioritization and intelligent scheduling to help you focus on what matters most.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Real-time Collaboration</p>
                    <p className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">
                      Work together seamlessly with your team through real-time updates and notifications.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">Advanced Analytics</p>
                    <p className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">
                      Get insights into your productivity patterns and team performance with detailed analytics.
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                      <Zap className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900 dark:text-white">AI Assistant</p>
                    <p className="mt-2 ml-16 text-base text-gray-500 dark:text-gray-300">
                      Get help with task creation, deadline management, and productivity suggestions from our AI assistant.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-blue-600">
            <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
                <span className="block">Ready to boost your productivity?</span>
                <span className="block">Start using TaskFlow AI today.</span>
              </h2>
              <p className="mt-4 text-lg leading-6 text-blue-200">
                Join thousands of users who have transformed their workflow with TaskFlow AI.
              </p>
              <SignInButton mode="modal">
                <button className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto transition-colors">
                  Sign up for free
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </SignedOut>
    </>
  );
}
