import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import store from './store';
import NewTab from './pages/NewTab';
import './assets/styles/tailwind.css';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <NewTab />
    </Provider>
  </React.StrictMode>
); 