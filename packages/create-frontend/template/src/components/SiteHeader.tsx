import type { JSX } from 'react';

import './SiteHeader.css';

interface SiteHeaderProps {
    readonly productName: string;
}

export function SiteHeader({ productName }: SiteHeaderProps): JSX.Element {
    return (
        <header className='site-header'>
            <a className='site-header-brand' href='#main-content'>
                <img alt='' height='32' src='/favicon.png' width='32' />
                <span>{productName}</span>
            </a>
        </header>
    );
}
