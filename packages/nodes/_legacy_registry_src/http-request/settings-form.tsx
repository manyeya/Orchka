// HTTP Request Settings Form - React component
// This is a placeholder that shows the component structure
// To be fully migrated, copy http-settings-form.tsx from apps/web/features/nodes/action/https-request/
// Note: This requires shadcn/ui components which should be peer dependencies

export interface HttpSettingsFormProps {
    defaultValues?: Partial<import("./types").HttpSettingsFormValues>;
    onSubmit: (values: import("./types").HttpSettingsFormValues) => void;
    onCancel?: () => void;
}

export function HttpSettingsForm({ defaultValues, onSubmit, onCancel }: HttpSettingsFormProps) {
    // TODO: Copy full implementation from apps/web/features/nodes/action/https-request/http-settings-form.tsx
    return null;
}

export { httpSettingsSchema, type HttpSettingsFormValues } from "./types";
