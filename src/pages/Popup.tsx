import React from 'react';

const Popup: React.FC = () => {
  return (
    <div className="p-4 w-64">
      <h1 className="text-xl font-bold mb-4">NyaTab</h1>
      <p className="mb-2">Customize your new tab experience</p>
      
      <div className="flex justify-between mt-4">
        <button 
          className="px-3 py-1 bg-primary text-white rounded"
          onClick={() => {
            chrome.runtime.openOptionsPage();
          }}
        >
          Settings
        </button>
        
        <button 
          className="px-3 py-1 bg-secondary text-white rounded"
          onClick={() => {
            chrome.tabs.create({ url: 'newtab.html' });
          }}
        >
          New Tab
        </button>
      </div>
    </div>
  );
};

export default Popup; 