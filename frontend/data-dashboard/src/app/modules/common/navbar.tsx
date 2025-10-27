'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '../../../lib/firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { Button } from './button';
import { Home, BarChart3, MessageSquare, LogOut, LogIn, UserPlus } from 'lucide-react';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to logout? This will delete all your uploaded files.');
    if (!confirmed) return;

    try {
      // Call backend to delete files before logging out
      const idToken = await user?.getIdToken();
      if (idToken) {
        await fetch('http://localhost:8000/api/delete-user-files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
      await signOut(auth);
      router.push('/');
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="h-8 w-20 bg-gray-200 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50" data-tutorial="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Dynamic Data Explorer</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Home</span>
                </Link>
                <Link href="/dashboard" className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <div className="flex items-center space-x-3 border-l border-gray-200 pl-4">
                  <span className="text-sm text-gray-700 hidden sm:block">
                    Welcome, {user.email?.split('@')[0]}
                  </span>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Login</span>
                </Button>
                <Button
                  onClick={() => router.push('/')}
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}