'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function Home() {
  const { isLoggedIn, user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {isLoggedIn ? (
        // Logged in view
        <div className="py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Welcome back, {user?.name}! 👋
              </h1>
              <p className="text-xl text-gray-600">
                Find your next favorite board game event or create one yourself
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {/* Events Card */}
              <Link href="/events" className="group cursor-pointer">
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all group-hover:scale-[1.02]">
                  <div className="text-4xl mb-4">📅</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Upcoming Events</h2>
                  <p className="text-gray-600 mb-4">
                    Explore board game events happening near you
                  </p>
                  <span className="text-blue-600 font-semibold group-hover:underline">
                    Browse Events →
                  </span>
                </div>
              </Link>

              {/* Create Event Card */}
              <Link href="/create-event" className="group cursor-pointer">
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all group-hover:scale-[1.02]">
                  <div className="text-4xl mb-4">🎮</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Event</h2>
                  <p className="text-gray-600 mb-4">
                    Organize a new board game event with your friends
                  </p>
                  <span className="text-blue-600 font-semibold group-hover:underline">
                    Create Now →
                  </span>
                </div>
              </Link>

              {/* Profile Card */}
              <Link href="/profile" className="group cursor-pointer">
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all group-hover:scale-[1.02]">
                  <div className="text-4xl mb-4">👤</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
                  <p className="text-gray-600 mb-4">
                    Manage your account and favorite games
                  </p>
                  <span className="text-blue-600 font-semibold group-hover:underline">
                    View Profile →
                  </span>
                </div>
              </Link>

              {/* Admin Card - only show for head admins */}
              {user?.role === 'head-admin' && (
                <Link href="/admin" className="group cursor-pointer">
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg p-6 transition-all group-hover:scale-[1.02] border-2 border-purple-200">
                    <div className="text-4xl mb-4">⚙️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Panel</h2>
                    <p className="text-gray-600 mb-4">
                      Manage users, games, and registrations
                    </p>
                    <span className="text-purple-600 font-semibold group-hover:underline">
                      Admin Tools →
                    </span>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Not logged in view
        <div className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <div className="text-6xl mb-4">🎲</div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Welcome to Board Games Community
              </h1>
              <p className="text-2xl text-gray-600 mb-8">
                Discover, organize, and enjoy board game events with fellow enthusiasts
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-4xl mb-4">👥</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect</h3>
                <p className="text-gray-600">
                  Meet other board game enthusiasts and build your gaming community
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Organize</h3>
                <p className="text-gray-600">
                  Create and manage board game events with ease
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-4xl mb-4">🏆</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Play</h3>
                <p className="text-gray-600">
                  Join games, track events, and have fun together
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-lg text-gray-600 mb-6">
                Get started by creating an account or logging in
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                >
                  Request Registration
                </Link>
                <Link
                  href="/login"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>

            <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-gray-600 mb-3">
                <strong>First time here?</strong> Request an account registration and wait for admin approval.
              </p>
              <p className="text-sm text-gray-600">
                For demo purposes, you can login with any of the pre-existing accounts.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
