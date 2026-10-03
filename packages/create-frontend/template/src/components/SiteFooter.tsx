import { useState } from 'react';
import type { JSX } from 'react';

import './SiteFooter.css';

const pendingServices = ['Instagram', 'Threads', 'Facebook'] as const;

export function SiteFooter(): JSX.Element {
    const [showPending, setShowPending] = useState(false);

    return (
        <footer className='site-footer'>
            <div className='footer-inner'>
                <div className='footer-top'>
                    <a
                        aria-label='Sessatakuma'
                        className='footer-brand'
                        href='#main-content'
                    >
                        <img
                            alt=''
                            className='footer-bear'
                            height='96'
                            src='/brand/logo-128.png'
                            width='96'
                        />
                    </a>
                    <div className='footer-contact'>
                        <nav
                            aria-label='Social media'
                            className='footer-social'
                        >
                            {pendingServices.map((service) => (
                                <button
                                    aria-label={service}
                                    className='footer-social-control'
                                    key={service}
                                    onClick={() => {
                                        setShowPending(true);
                                    }}
                                    type='button'
                                >
                                    <img
                                        alt=''
                                        height='24'
                                        src={`/brand/${service.toLowerCase()}.svg`}
                                        width='24'
                                    />
                                </button>
                            ))}
                            <a
                                aria-label='GitHub'
                                className='footer-social-control'
                                href='https://github.com/sessatakuma'
                            >
                                <img
                                    alt=''
                                    height='24'
                                    src='/brand/github.svg'
                                    width='24'
                                />
                            </a>
                        </nav>
                        <a
                            className='footer-email'
                            href='mailto:contact@sessatakuma.dev'
                        >
                            contact@sessatakuma.dev
                        </a>
                        {showPending ? (
                            <p
                                className='footer-status'
                                lang='zh-Hant'
                                role='status'
                            >
                                {
                                    '\u9019\u500B\u5E33\u865F\u9084\u5728\u6E96\u5099\u4E2D\u3002'
                                }
                            </p>
                        ) : undefined}
                    </div>
                </div>
                <p className='footer-purpose'>
                    Sessatakuma is developing tools for Japanese learning and
                    planning a Japanese speaking practice community. By sharing
                    the complete practice system our team members built in the
                    past, along with tools designed for that system, we want to
                    help learners make speaking practice more efficient and
                    steadily build the confidence to speak Japanese.
                </p>
            </div>
            <p aria-label='Sessatakuma' className='footer-wordmark'>
                <span>Sessa</span>
                <span>takuma</span>
            </p>
        </footer>
    );
}
