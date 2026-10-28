import { useNavigate } from '@tanstack/react-router';
import { demo } from '../demo/store';
import { errorMessage, useUi } from './ui-context';

export function useStartCreation() {
  const navigate = useNavigate(),
    ui = useUi();
  return (sceneId: string, options: Parameters<typeof demo.begin>[1] = {}) => {
    try {
      const creationId = demo.begin(sceneId, options);
      ui.close();
      void navigate({ to: '/creations/$creationId', params: { creationId } });
      return creationId;
    } catch (error) {
      ui.notify(errorMessage(error));
      return undefined;
    }
  };
}
