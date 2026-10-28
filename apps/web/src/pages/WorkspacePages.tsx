import { useLoaderData, useParams } from '@tanstack/react-router';
import { Workspace } from '../workspace/Workspace';

export function ImagesPage() {
  const id = useLoaderData({ from: '/images' });
  return <Workspace key={id} sessionId={id} />;
}
export function VideosPage() {
  const id = useLoaderData({ from: '/videos' });
  return <Workspace key={id} sessionId={id} />;
}
export function CreationPage() {
  const { creationId } = useParams({ from: '/creations/$creationId' });
  return <Workspace key={creationId} sessionId={creationId} />;
}
