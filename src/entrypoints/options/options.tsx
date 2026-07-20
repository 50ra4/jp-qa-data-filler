import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { OptionsRoot } from './OptionsRoot';
import './options.css';

// oxlint-disable-next-line typescript/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OptionsRoot />
  </StrictMode>,
);
