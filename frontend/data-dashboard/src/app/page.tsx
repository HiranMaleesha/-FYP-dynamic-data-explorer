'use client'
import { useState } from 'react';
import UploaderBox from './modules/landing-page/uploader-box';
import AuthComponent from './modules/common/auth-component';
import { User } from 'firebase/auth';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="relative isolate flex flex-grow px-6 lg:px-8 pt-8">
        <div className="mx-auto max-w-4xl w-full">
          <div className="text-center">
            <h1 className="text-h3 sm:text-h2 md:text-h1 text-secondary-700 mt-8 leading-tight font-semibold tracking-normal break-words hyphens-auto">
              Dynamic Data Explorer
            </h1>

            <p className="text-secondary-500 mt-4 md:max-w-3xl md:text-xl mx-auto">
              Upload your data, and get insights instantly. Ask questions, get answers with AI-powered analysis.
            </p>

            {user ? (
              <div className="mt-12">
                <UploaderBox />
              </div>
            ) : (
              <div className="mt-12 max-w-md mx-auto">
                <AuthComponent onAuthChange={setUser} />
                <div className="mt-6 text-gray-600 text-sm">
                  Please log in to upload and analyze your data.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
