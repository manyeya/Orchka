"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const ifSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  condition: z.string().min(1, "Condition is required"),
});

export type IfSettingsFormValues = z.infer<typeof ifSettingsSchema>;

interface IfSettingsFormProps {
  defaultValues?: Partial<IfSettingsFormValues>;
  onSubmit: (values: IfSettingsFormValues) => void;
  onCancel?: () => void;
}

/**
 * Settings form for the If Node.
 * Allows users to configure the node name and condition expression.
 */
export function IfSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: IfSettingsFormProps) {
  const form = useForm<IfSettingsFormValues>({
    resolver: zodResolver(ifSettingsSchema),
    defaultValues: {
      name: "",
      condition: "",
      ...defaultValues,
    },
  });

  const handleSubmit = (values: IfSettingsFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">If Node Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure the condition that determines which branch to execute
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="If" {...field} />
                </FormControl>
                <FormDescription>
                  A unique name for this node in the workflow
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{{ $json.status === "active" }}'
                    className="font-mono text-sm min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  An expression that evaluates to true or false. Use{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {"{{ }}"}
                  </code>{" "}
                  syntax for dynamic values.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Form>
  );
}
