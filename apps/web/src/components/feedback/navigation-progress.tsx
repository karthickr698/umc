import { useNavigation } from 'react-router';

/** Thin bar at the top of the viewport while a route (or its lazy chunk) is loading. */
export function NavigationProgress() {
  const navigation = useNavigation();
  if (navigation.state === 'idle') return null;

  return (
    <div className="navigation-progress" role="progressbar" aria-label="Loading page">
      <div className="navigation-progress__bar" />
    </div>
  );
}
