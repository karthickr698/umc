import { useCallback, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router';
import { Skeleton } from '@/components/feedback/skeleton';
import { APP_ROUTES } from '@/config/routes';
import { useSession } from '@/features/auth';
import { useClickOutside } from '@/hooks/use-click-outside';
import { useEscapeKey } from '@/hooks/use-escape-key';
import { getInitials, humanizeEnum } from '@/utils/format';

export function UserMenu() {
  const { state, user, signOut } = useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(containerRef, close, open);
  useEscapeKey(close, open);

  if (state.status === 'loading') {
    return (
      <div className="user-menu" aria-busy="true" aria-label="Loading account">
        <Skeleton circle width="2.25rem" height="2.25rem" />
      </div>
    );
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
      close();
    }
  };

  const displayName = user?.name ?? 'Guest';
  const subtitle = user ? humanizeEnum(user.role) : 'Not signed in';

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="user-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="avatar" aria-hidden>
          {user ? getInitials(user.name) : <UserRound size={18} />}
        </span>
        <span className="user-menu__identity">
          <span className="user-menu__name">{displayName}</span>
          <span className="user-menu__role">{subtitle}</span>
        </span>
        <ChevronDown className="user-menu__chevron" size={16} aria-hidden />
      </button>

      {open && (
        <div id={menuId} className="user-menu__dropdown" role="menu" aria-label="Account">
          <div className="user-menu__header">
            <p className="user-menu__header-name">{displayName}</p>
            <p className="user-menu__header-email">{user?.email ?? subtitle}</p>
          </div>
          <Link
            to={APP_ROUTES.settings}
            className="user-menu__item"
            role="menuitem"
            onClick={close}
          >
            <Settings size={16} aria-hidden />
            Settings
          </Link>
          {user && (
            <button
              type="button"
              className="user-menu__item user-menu__item--danger"
              role="menuitem"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
            >
              <LogOut size={16} aria-hidden />
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
