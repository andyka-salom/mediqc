import { Head } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

interface WelcomeProps {
    appName: string;
}

export default function Welcome({ appName }: WelcomeProps) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
                <div className="text-center space-y-6 max-w-lg">
                    <h1 className="text-4xl font-bold tracking-tight">
                        Welcome to {appName}
                    </h1>
                    <p className="text-muted-foreground text-lg">
                        Laravel 13 · Inertia · React · TypeScript · Tailwind · shadcn/ui
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <Button>Get Started</Button>
                        <Button variant="outline">Learn More</Button>
                    </div>
                </div>
            </div>
        </>
    );
}
