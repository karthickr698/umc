import { Spinner } from './spinner';

interface PageLoaderProps {
  label?: string;
  /** Fill the whole viewport instead of the content area. */
  fullScreen?: boolean;
}

export function PageLoader({ label = 'Loading…', fullScreen = false }: PageLoaderProps) {
  return (
    <div className={`page-loader${fullScreen ? ' page-loader--full' : ''}`}>
      <Spinner size={32} label={label} />
      <p className="page-loader__label" aria-hidden>
        {label}
      </p>
    </div>
  );
}

/** For route `HydrateFallback`s outside the app shell. */
export function FullScreenPageLoader() {
  return <PageLoader fullScreen />;
}
