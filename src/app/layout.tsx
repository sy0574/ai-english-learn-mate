import { TTSProvider } from '@/contexts/TTSContext';
import { GlobalTTSController } from '@/components/common/GlobalTTSController';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TTSProvider>
      {children}
      <GlobalTTSController />
    </TTSProvider>
  );
}
