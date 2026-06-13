import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, Sparkles, Utensils, Hash, ListTree } from 'lucide-react';

interface ProcessingStateProps {
  fileName: string;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ fileName }) => {
  const [platesFound, setPlatesFound] = useState(0);
  const [categoriesFound, setCategoriesFound] = useState(0);
  const [status, setStatus] = useState('Reading text layer...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setCategoriesFound(1);
      setPlatesFound(3);
      setStatus('Identifying dishes...');
    }, 1000);

    const timer2 = setTimeout(() => {
      setCategoriesFound(2);
      setPlatesFound(7);
      setStatus('Categorizing items...');
    }, 2000);

    const timer3 = setTimeout(() => {
      setCategoriesFound(3);
      setPlatesFound(12);
      setStatus('Extracting ingredients...');
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="relative w-32 h-32 mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-indigo-600" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center w-full max-w-lg"
      >
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Analyzing {fileName}</h3>
        <p className="text-gray-500 mb-8">
          Our AI is reading your menu, extracting dish details, and organizing categories...
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Utensils className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Dishes Found</p>
              <p className="text-xl font-black text-gray-900 leading-none">{platesFound}</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <ListTree className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Categories</p>
              <p className="text-xl font-black text-gray-900 leading-none">{categoriesFound}</p>
            </div>
          </motion.div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              {status}
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-widest">
              Live AI Feed
            </span>
          </div>
          
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 4.5 }}
              className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
