import type { JSX } from 'react';

// eslint-disable-next-line @typescript-eslint/no-restricted-imports -- The demo renders the exact CLI starter.
import { App as StarterApp } from '../../packages/create-frontend/template/src/components/App.js';

export function App(): JSX.Element {
    return <StarterApp productName='Sessatakuma Frontend' />;
}
