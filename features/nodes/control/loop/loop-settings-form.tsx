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

const loopSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["array", "count"]),
  arrayExpression: z.string().optional(),
  count: z.coerce.number().min(1, "Count must be at least 1").optional(),
}).refine(
  (data) => {
    if (data.mode === "array") {
      return data.arrayExpression && data.arrayExpression.trim() !== "";
    }
    if (data.mode === "count") {
      return data.count !== undefined && data.count >= 1;
    }
    return true;
  },
  {
    message: "Array expression is required for array mode, count is required for count mode",
    path: ["arrayExpression"],
  }
);

export type LoopSettingsFormValues = z.infer<typeof loopSettingsSchema>;

interface LoopSettingsFormProps {
  defaultValues?: Partial<LoopSettingsFormValues>;
  onSubmit: (values: LoopSettingsFormValues) => void;
  onCancel?: () => void;
}


/**
 * Settings form for the Loop Node.
 * Allows users to configure the node name, loop mode, and corresponding configuration.
 * 
 * Requirements:
 * - 3.2: Provide form with name field, loop mode selector, and configuration
 */
export function LoopSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: LoopSettingsFormProps) {
  const form = useForm<LoopSettingsFormValues>({
    resolver: zodResolver(loopSettingsSchema),
    defaultValues: {
      name: "",
      mode: "array",
      arrayExpression: "",
      count: 10,
      ...defaultValues,
    },
  });

  const mode = form.watch("mode");

  const handleSubmit = (values: LoopSettingsFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Loop Node Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure how the loop iterates over data or a count
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Loop" {...field} />
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
                <FormLabel>Loop Mode</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loop mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="array">Array - Iterate over items</SelectItem>
                    <SelectItem value="count">Count - Fixed iterations</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Choose whether to iterate over an array or a fixed number of times
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "array" && (
            <FormField
              control={form.control}
              name="arrayExpression"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Array Expression</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='{{ $json.items }}'
                      className="font-mono text-sm min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    An expression that evaluates to an array. Use{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">
                      {"{{ }}"}
                    </code>{" "}
                    syntax. Each item will be available as{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$item</code>,
                    with{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$index</code>{" "}
                    and{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$total</code>.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === "count" && (
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Iteration Count</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      placeholder="10"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Number of times to iterate (1 to N). Each iteration provides{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$index</code>{" "}
                    and{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$total</code>.
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
