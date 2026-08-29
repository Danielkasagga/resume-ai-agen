export {}

declare module 'react' {
  export const StrictMode: any
  export const useEffect: any
  export const useRef: any
  export const useState: any
}

declare module 'react-dom/client' {
  export const createRoot: any
}

declare module 'react/jsx-runtime' {
  export const jsx: any
  export const jsxs: any
  export const Fragment: any
}

declare module '*.css' {
  const styles: Record<string, string>
  export default styles
}

declare namespace JSX {
  interface IntrinsicElements {
    [elementName: string]: any
  }
}
