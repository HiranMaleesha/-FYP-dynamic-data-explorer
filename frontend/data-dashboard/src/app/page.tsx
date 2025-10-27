'use client';
import { useState } from 'react';
import UploaderBox from './modules/landing-page/uploader-box';
import AuthComponent from './modules/common/auth-component';
import { User } from 'firebase/auth';
import { motion } from 'framer-motion';
import { BarChart3, Database, Cpu, Sparkles } from 'lucide-react';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 text-gray-800 flex flex-col">      

      {/* Hero Section */}
      <main className="flex-grow flex flex-col justify-center items-center text-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800 leading-tight">
            Empower Your Data.  
            <span className="text-indigo-600"> Instantly Analyze & Visualize</span>
          </h2>
          <p className="mt-6 text-lg text-gray-600">
            Upload your dataset and watch AI clean, transform, and visualize your data automatically.  
            Get interactive dashboards and intelligent insights without writing a single line of code.
          </p>

          <div className="mt-10">
            {user ? (
              <UploaderBox />
            ) : (
              <div className="max-w-md mx-auto">
                <AuthComponent onAuthChange={setUser} />
                <p className="mt-4 text-sm text-gray-500">
                  Log in to start exploring your data.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {[
            { icon: Database, title: 'Smart Data Upload', desc: 'Easily upload CSV or Excel files. We detect structure and handle preprocessing automatically.' },
            { icon: Cpu, title: 'AI-Powered Cleaning', desc: 'Remove duplicates, fix missing values, and normalize data intelligently with AI assistance.' },
            { icon: BarChart3, title: 'Instant Dashboards', desc: 'Generate beautiful charts and insights instantly — no manual configuration needed.' },
            { icon: Sparkles, title: 'Interactive Analysis', desc: 'Ask questions like “Which vehicle sold most this month?” and get visual answers.' },
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="p-6 bg-gradient-to-br from-indigo-50 to-blue-100 rounded-2xl shadow-md hover:shadow-lg transition-shadow"
            >
              <feature.icon className="mx-auto h-10 w-10 text-indigo-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howitworks" className="py-20 bg-gradient-to-br from-indigo-50 via-white to-blue-100 text-center">
        <div className="max-w-5xl mx-auto px-6">
          <h3 className="text-3xl font-bold text-gray-800 mb-8">How It Works</h3>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Upload', desc: 'Drag and drop your dataset — CSV, Excel, or JSON.' },
              { step: '2', title: 'AI Cleans & Analyzes', desc: 'Automatic cleaning, transformation, and exploratory analysis happen in seconds.' },
              { step: '3', title: 'Visualize & Ask', desc: 'View dynamic charts or ask questions for AI-powered insights.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.3 }}
                className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="text-4xl font-bold text-indigo-600 mb-2">{item.step}</div>
                <h4 className="font-semibold text-gray-800">{item.title}</h4>
                <p className="text-sm text-gray-600 mt-2">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-gray-300 text-center text-sm">
        <p>© {new Date().getFullYear()} Dynamic Data Explorer. All rights reserved.</p>
      </footer>
    </div>
  );
}
