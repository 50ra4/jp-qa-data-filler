import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppErrorBoundary } from '../../lib/errors/AppErrorBoundary';
import { getMessages } from '../../lib/i18n/messages';
import { OptionsRoot } from './OptionsRoot';
import './options.css';

const messages = getMessages(navigator.language);

// oxlint-disable-next-line typescript/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary fallback={messages.unexpectedUiError}>
      <OptionsRoot />
    </AppErrorBoundary>
  </StrictMode>,
);
