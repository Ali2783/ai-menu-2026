import React, { useRef } from 'react';
import { Upload, Image as ImageIcon, FileText, LayoutDashboard } from 'lucide-react';
import { motion } from 'motion/react';

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      onFileSelect(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto w-full pt-12 text-center"
    >
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Welcome back, Chef.
        </h1>
      </div>

      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className="relative group cursor-pointer"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-3xl p-16 transition-all duration-300">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,.pdf"
            onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
          />
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Drag & drop your menu</h3>
            <p className="text-gray-500 mb-8">Supports JPG, PNG, and PDF up to 15MB</p>
            
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all">
              Browse Files
            </button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8">
        {[
          { icon: ImageIcon, title: 'AI OCR', desc: 'Precise text extraction' },
          { icon: FileText, title: 'Smart Categorization', desc: 'Automatic grouping' },
          { icon: LayoutDashboard, title: 'Instant Design', desc: 'Beautiful templates' },
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <feature.icon className="w-6 h-6 text-gray-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-1">{feature.title}</h4>
            <p className="text-sm text-gray-500">{feature.desc}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
