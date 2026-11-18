import { redirect } from 'next/navigation';
import { getVenueSettingsCore } from '@/lib/actions/settings';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const settings = await getVenueSettingsCore();
  if (!settings.initial_setup_completed) {
    redirect('/admin');
  }
  redirect('/display');
}

