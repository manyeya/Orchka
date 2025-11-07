'use client';

import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FieldLabel } from '@/components/ui/field';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Field, FieldError } from '@/components/ui/field';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import Link from 'next/link';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckIcon, EyeIcon, EyeOffIcon, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const passwordRequirements = [
    {
        id: "length",
        label: "At least 8 characters",
        test: (val: string) => val.length >= 8,
    },
    {
        id: "lowercase",
        label: "One lowercase letter",
        test: (val: string) => /[a-z]/.test(val),
    },
    {
        id: "uppercase",
        label: "One uppercase letter",
        test: (val: string) => /[A-Z]/.test(val),
    },
    { id: "number", label: "One number", test: (val: string) => /\d/.test(val) },
    {
        id: "special",
        label: "One special character",
        test: (val: string) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
    },
]

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long"),
    email: z.string().email("Please enter a valid email"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .refine(
            (val) => /[a-z]/.test(val),
            "Password must contain at least one lowercase letter"
        )
        .refine(
            (val) => /[A-Z]/.test(val),
            "Password must contain at least one uppercase letter"
        )
        .refine(
            (val) => /\d/.test(val),
            "Password must contain at least one number"
        )
        .refine(
            (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
            "Password must contain at least one special character"
        ),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type RegisterSchema = z.infer<typeof registerSchema>;

export function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const password = useWatch({
        control: form.control,
        name: "password",
    });

    // Calculate password strength.
    const metRequirements = passwordRequirements.filter((req) =>
        req.test(password || "")
    )
    const strengthPercentage =
        (metRequirements.length / passwordRequirements.length) * 100

    // Determine strength level and color.
    const getStrengthColor = () => {
        if (strengthPercentage === 0) return "bg-neutral-200"
        if (strengthPercentage <= 40) return "bg-red-500"
        if (strengthPercentage <= 80) return "bg-yellow-500"
        return "bg-green-500"
    }

    const allRequirementsMet =
        metRequirements.length === passwordRequirements.length

    async function onSubmit(values: RegisterSchema) {
        setError(null);

        await authClient.signUp.email({
            email: values.email,
            password: values.password,
            name: values.name,
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
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Sign up for a new account</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col gap-4 p-4'>
                        {/* Social Login Buttons */}
                        <div className='flex flex-col gap-3'>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                onClick={() => authClient.signIn.social({ provider: 'github' })}
                                disabled={isPending}
                            >
                                Continue with GitHub
                            </Button>
                            <Button
                                type='button'
                                variant='outline'
                                className='w-full'
                                onClick={() => authClient.signIn.social({ provider: 'google' })}
                                disabled={isPending}
                            >
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
                                <div className='flex flex-col gap-4'>
                                    <FormField
                                        control={form.control}
                                        name='name'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        type='text'
                                                        autoComplete='name'
                                                        placeholder='John Doe'
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
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel htmlFor="password-input">
                                                    Password
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <HelpCircle className="ml-1 size-4 text-muted-foreground" />
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Password must meet all requirements below</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </FieldLabel>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        id="password-input"
                                                        type={showPassword ? "text" : "password"}
                                                        placeholder="Enter your password"
                                                        aria-invalid={fieldState.invalid}
                                                        autoComplete="new-password"
                                                        className="pr-20"
                                                    />
                                                    <div className="absolute right-0 top-0 flex h-full items-center">
                                                        <CheckIcon
                                                            className={`mr-2 h-4 w-4 ${
                                                                allRequirementsMet
                                                                    ? "text-green-500"
                                                                    : "text-muted-foreground"
                                                            }`}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-full px-3 py-2 hover:bg-transparent"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            aria-label={showPassword ? "Hide password" : "Show password"}
                                                        >
                                                            {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Password strength meter. */}
                                                <div className="space-y-1">
                                                    <Progress
                                                        value={strengthPercentage}
                                                        className={getStrengthColor()}
                                                    />

                                                    {/* Requirements list. */}
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        {passwordRequirements.map((requirement) => {
                                                            const isMet = requirement.test(password || "")
                                                            return (
                                                                <div
                                                                    key={requirement.id}
                                                                    className="flex items-center gap-1.5 text-xs"
                                                                >
                                                                    <CheckIcon
                                                                        className={
                                                                            isMet
                                                                                ? "size-3 text-green-500"
                                                                                : "text-muted-foreground size-3"
                                                                        }
                                                                    />
                                                                    <span
                                                                        className={
                                                                            isMet
                                                                                ? "text-foreground"
                                                                                : "text-muted-foreground"
                                                                        }
                                                                    >
                                                                        {requirement.label}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                {fieldState.invalid && (
                                                    <FieldError errors={[fieldState.error]} />
                                                )}
                                            </Field>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name='confirmPassword'
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm Password</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Input
                                                        {...field}
                                                        type={showConfirmPassword ? "text" : "password"}
                                                        placeholder="Confirm your password"
                                                        autoComplete="new-password"
                                                        disabled={isPending}
                                                        className="pr-10"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                                    >
                                                        {showConfirmPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
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
                                                Creating account...
                                            </>
                                        ) : (
                                            'Create account'
                                        )}
                                    </Button>

                                    {error && (
                                        <div className='text-sm text-red-600 text-center'>
                                            {error}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </Form>
                    </div>
                </CardContent>
                <CardFooter className='border-t pt-4 text-sm text-muted-foreground'>
                    <span className='w-full text-center'>
                        Already have an account?{' '}
                        <Button variant='link' className='px-1 font-semibold' asChild>
                            <Link href='/login'>Sign in</Link>
                        </Button>
                    </span>
                </CardFooter>
            </Card>
        </div>
    );
}
