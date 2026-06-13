import React from 'react';
import { MenuData } from '../types';

interface WordPressConfirmProps {
  menuData: MenuData;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WordPressConfirm: React.FC<WordPressConfirmProps> = ({ menuData, onConfirm, onCancel }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">Sync to WordPress?</h2>
      <p className="text-gray-500 mb-8">Are you sure you want to update your menu on {menuData.wordpressConfig?.siteUrl || 'your WordPress site'}? This action will overwrite the current menu.</p>
      
      <div className="flex justify-center gap-4">
        <button
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-bold text-gray-600 hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
        >
          Yes, Update Now
        </button>
      </div>
    </div>
  );
};
