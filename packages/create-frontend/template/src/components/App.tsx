import type { JSX } from 'react';

import { SiteFooter } from './SiteFooter.js';
import { SiteHeader } from './SiteHeader.js';

import './App.css';

interface AppProps {
    readonly productName?: string;
}

export function App({
    productName = 'Sessatakuma Frontend',
}: AppProps): JSX.Element {
    return (
        <div className='product-shell'>
            <SiteHeader productName={productName} />
            <main className='page-content' id='main-content'>
                <h1>Home</h1>
            </main>
            <SiteFooter />
        </div>
    );
}
