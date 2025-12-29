
import { notFound } from 'next/navigation';
import HomeOne from '@/components/newdesign/HomeOne';

export default async function ProtectedHomeOne({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const accessKey = resolvedSearchParams?.access_token;
    const dummyValue = "syndet_secret_123";

    if (accessKey === dummyValue) {
        return <HomeOne />;
    }

    notFound();
}
