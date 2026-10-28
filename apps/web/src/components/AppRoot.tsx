import { Layout } from './Layout';
import { UiProvider } from './UiProvider';

export function AppRoot() {
  return (
    <UiProvider>
      <Layout />
    </UiProvider>
  );
}
