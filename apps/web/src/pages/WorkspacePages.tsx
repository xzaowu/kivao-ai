import { useParams } from '@tanstack/react-router';
import { Workspace } from '../workspace/Workspace';

export function CreationPage() {
  const { creationId } = useParams({ from: '/creations/$creationId' });
  return <Workspace key={creationId} sessionId={creationId} />;
}
