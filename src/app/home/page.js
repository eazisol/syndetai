
import { notFound } from 'next/navigation';
import HomePage from '@/components/newdesign/HomePage';
import TokenHider from '@/components/TokenHider';

export default async function ProtectedHome({ searchParams }) {
    const resolvedSearchParams = await searchParams;
    const accessKey = resolvedSearchParams?.access_token;
    const dummyValue = "syndet_secret_123";

    try {
        const decodedKey = Buffer.from(accessKey || '', 'base64').toString('utf-8');

        if (decodedKey === dummyValue) {
            return (
                <>
                    <TokenHider />
                    <HomePage />
                </>
            );
        }
    } catch (e) {
        // Decoding failed
    }

    notFound();
}
