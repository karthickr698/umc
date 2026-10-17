import type { UserDto } from '@umc/shared';

export interface ContactListProps {
  users: readonly Pick<UserDto, 'id' | 'name' | 'email' | 'phone'>[];
  emptyMessage: string;
}

/** Names with clickable email and phone, e.g. a company's owners. */
export function ContactList({ users, emptyMessage }: ContactListProps) {
  if (users.length === 0) return <p className="table__secondary">{emptyMessage}</p>;

  return (
    <ul className="contact-list">
      {users.map((user) => (
        <li key={user.id}>
          <span className="contact-list__name">{user.name}</span>
          <a className="table__secondary" href={`mailto:${user.email}`}>
            {user.email}
          </a>
          {user.phone && (
            <a className="table__secondary" href={`tel:${user.phone}`}>
              {user.phone}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}
