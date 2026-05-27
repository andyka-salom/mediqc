/// <reference types="vite/client" />

declare module '*.svg' {
    import * as React from 'react';
    export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    const src: string;
    export default src;
}

declare global {
    function route(name: string, params?: any, absolute?: boolean): string;
    function route(): { current: (name?: string, params?: any) => boolean };
}

export {};
