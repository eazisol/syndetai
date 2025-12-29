
import { notFound } from 'next/navigation';
import HomePage from '@/components/newdesign/HomePage';

export default async function ProtectedHome({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const accessKey = resolvedSearchParams?.access_token;
    const dummyValue = "syndet_secret_123";

    if (accessKey === dummyValue) {
        return <HomePage />;
    }

    notFound();
}
