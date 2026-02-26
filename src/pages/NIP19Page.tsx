import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import NotFound from './NotFound';
import { ProfilePage } from './ProfilePage';
import { NotePage } from './NotePage';
import { AddressableEventPage } from './AddressableEventPage';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      return <ProfilePage pubkey={data as string} />;

    case 'nprofile':
      return <ProfilePage pubkey={(data as { pubkey: string }).pubkey} />;

    case 'note':
      return <NotePage eventId={data as string} />;

    case 'nevent':
      return <NotePage eventId={(data as { id: string }).id} />;

    case 'naddr':
      return (
        <AddressableEventPage 
          kind={(data as { kind: number; pubkey: string; identifier: string }).kind}
          pubkey={(data as { kind: number; pubkey: string; identifier: string }).pubkey}
          identifier={(data as { kind: number; pubkey: string; identifier: string }).identifier}
        />
      );

    default:
      return <NotFound />;
  }
} 