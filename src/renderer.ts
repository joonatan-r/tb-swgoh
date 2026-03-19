
import { createRoot } from 'react-dom/client';
import App from './App';
import React from 'react';

const domNode = document.getElementById('reactApp');
const root = createRoot(domNode);
root.render(React.createElement(App));
