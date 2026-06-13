import React from 'react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

export const UnauthorizedView: React.FC = () => {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md text-center">
        <h2 className="text-xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600 mb-6">You do not have permission to access this dashboard.</p>
        
        {user && (
          <p className="text-sm text-gray-500 mb-6">UID: {user.uid}</p>
        )}

        <button
          onClick={handleSignOut}
          className="w-full bg-gray-100 text-gray-800 px-6 py-2 rounded-lg font-bold hover:bg-gray-200"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};
