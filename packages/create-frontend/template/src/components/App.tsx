import type { JSX } from 'react';

export function App(): JSX.Element {
    // Keep App.tsx coordinating screens and providers. Extract components early so this never
    // becomes a 3,000-line god file.
    return (
        <main className='app'>
            <section className='app__content'>
                <h1 className='app__title'>Sessatakuma Frontend</h1>
                <p className='app__description'>
                    One command creates a clean React repo. Strict checks keep
                    it that way.
                </p>
            </section>
        </main>
    );
}
