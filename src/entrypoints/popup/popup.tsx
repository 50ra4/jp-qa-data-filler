import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { PopupRoot } from './PopupRoot';
import './popup.css';

// oxlint-disable-next-line typescript/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PopupRoot />
  </StrictMode>,
);
