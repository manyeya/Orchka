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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const waitSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["duration", "until"]),
  duration: z.object({
    value: z.coerce.number().min(1, "Duration must be at least 1"),
    unit: z.enum(["seconds", "minutes", "hours", "days"]),
  }).optional(),
  until: z.string().optional(),
}).refine(
  (data) => {
    if (data.mode === "duration") {
      return data.duration && data.duration.value >= 1;
    }
    if (data.mode === "until") {
      return data.until && data.until.trim() !== "";
    }
    return true;
  },
  {
    message: "Duration is required for duration mode, timestamp/expression is required for until mode",
    path: ["duration"],
  }
);

export type WaitSettingsFormValues = z.infer<typeof waitSettingsSchema>;

interface WaitSettingsFormProps {
  defaultValues?: Partial<WaitSettingsFormValues>;
  onSubmit: (values: WaitSettingsFormValues) => void;
  onCancel?: () => void;
}

/**
 * Settings form for the Wait Node.
 * Allows users to configure the node name, wait mode, and corresponding configuration.
 * 
 * Requirements:
 * - 4.2: Provide form with name field, wait mode selector, and configuration
 * - 4.3: Support duration mode with value and unit fields
 * - 4.4: Support until mode with timestamp expression field
 */
export function WaitSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: WaitSettingsFormProps) {
  const form = useForm<WaitSettingsFormValues>({
    resolver: zodResolver(waitSettingsSchema),
    defaultValues: {
      name: "",
      mode: "duration",
      duration: {
        value: 5,
        unit: "minutes",
      },
      until: "",
      ...defaultValues,
    },
  });

  const mode = form.watch("mode");

  const handleSubmit = (values: WaitSettingsFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Wait Node Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure how long the workflow should pause
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Wait" {...field} />
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
            name="mode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wait Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select wait mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="duration">Duration - Wait for a specific time period</SelectItem>
                    <SelectItem value="until">Until - Wait until a specific timestamp</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose whether to wait for a duration or until a specific time
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "duration" && (
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="duration.value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        placeholder="5"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration.unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="seconds">Seconds</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {mode === "until" && (
            <FormField
              control={form.control}
              name="until"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Timestamp Expression</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{{ $json.scheduledTime }} or 2024-12-31T23:59:59Z'
                      className="font-mono text-sm min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    An ISO timestamp or expression that evaluates to a timestamp. Use{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {"{{ }}"}
                    </code>{" "}
                    syntax for dynamic values.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
