'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';

const loginSchema = z.object({
    email: z.email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginSchema = z.infer<typeof loginSchema>;

export function LoginForm() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: LoginSchema) {
        await authClient.signIn.email({
            email: values.email,
            password: values.password,
            callbackURL: "/",
        }, {
            onSuccess: () => {
                router.push("/");
            },
            onError: (ctx) => {
                toast.error(ctx.error.message);
            },
        });
    }

    const isPending = form.formState.isSubmitting;

    return (
        <div className='flex flex-col gap-6'>
            <Card className='w-[600px] mx-auto'>
                <CardHeader className='text-center'>
                    <div className='flex justify-center mb-6'>
                        <Image
                            src='/flowbase-logo.svg'
                            alt='Logo'
                            width={120}
                            height={40}
                        />
                    </div>
                    <CardTitle>Welcome Back</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col gap-6 p-6'>
                        {/* Social Login Buttons */}
                        <div className='flex flex-col gap-3'>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                onClick={() => authClient.signIn.social({ provider: 'github' })}
                                disabled={isPending}
                            >
                                <Image
                                    src='/github-logo.svg'
                                    alt='GitHub'
                                    width={20}
                                    height={20}
                                    className='mr-2'
                                />
                                Continue with GitHub
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                onClick={() => authClient.signIn.social({ provider: 'google' })}
                                disabled={isPending}
                            >
                                <Image
                                    src='/google-logo.svg'
                                    alt='Google'
                                    width={20}
                                    height={20}
                                    className='mr-2'
                                />
                                Continue with Google
                            </Button>
                        </div>

                        <div className='relative'>
                            <div className='absolute inset-0 flex items-center'>
                                <span className='w-full border-t' />
                            </div>
                            <div className='relative flex justify-center text-xs uppercase'>
                                <span className='bg-background px-2 text-muted-foreground'>
                                    Or continue with email
                                </span>
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <div className='flex flex-col gap-6'>
                                    <FormField
                                        control={form.control}
                                        name='email'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email address</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='email'
                                                        autoComplete='email'
                                                        placeholder='you@example.com'
                                                        disabled={isPending}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='password'
                                        render={({ field }) => (
                                            <FormItem>
                                                <div className='flex items-center justify-between'>
                                                    <FormLabel>Password</FormLabel>
                                                    <Button variant='link' size='sm' className='px-0 font-medium' asChild>
                                                        <Link href='/forgot-password'>Forgot password?</Link>
                                                    </Button>
                                                </div>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type={showPassword ? "text" : "password"}
                                                            placeholder="••••••••"
                                                            autoComplete="current-password"
                                                            disabled={isPending}
                                                            className="pr-10"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />


                                    <Button type='submit' disabled={isPending} className='w-full'>
                                        {isPending ? (
                                            <>
                                                <Spinner className='size-4' />
                                                Signing in...
                                            </>
                                        ) : (
                                            'Sign in'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </CardContent>
                <CardFooter className='border-t pt-6 text-sm text-muted-foreground'>
                    <span className='w-full text-center'>
                        Don&apos;t have an account?{' '}
                        <Button variant='link' className='px-1 font-semibold' asChild>
                            <Link href='/register'>Create one</Link>
                        </Button>
                    </span>
                </CardFooter>
            </Card>
        </div>
    );
}
