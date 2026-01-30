"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2, GitMerge, Code2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";

const mergeSourceSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
});

const mergeSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mode: z.enum(["append", "mergeByKey", "keepFirst", "keepLast", "combine", "custom"]),
  sources: z.array(mergeSourceSchema).min(2, "At least 2 sources are required"),
  keyField: z.string().optional(),
  includeAllFields: z.boolean().optional(),
  expression: z.string().optional(),
});

// Refine schema based on mode
const mergeSettingsSchemaRefined = mergeSettingsSchema.refine(
  (data) => {
    if (data.mode === "mergeByKey") {
      return data.keyField !== undefined && data.keyField !== "";
    }
    if (data.mode === "custom") {
      return data.expression !== undefined && data.expression !== "";
    }
    return true;
  },
  {
    message: "This field is required",
    path: ["keyField", "expression"],
  }
);

export type MergeSettingsFormValues = z.infer<typeof mergeSettingsSchemaRefined>;

interface MergeSettingsFormProps {
  defaultValues?: Partial<MergeSettingsFormValues>;
  onSubmit: (values: MergeSettingsFormValues) => void;
  onCancel?: () => void;
}

const mergeModes = [
  { value: "append", label: "Append", description: "Combine arrays from all sources", expression: "$append($input1, $input2, ...)" },
  { value: "mergeByKey", label: "Merge by Key", description: "Join data on a common field", expression: "Custom join logic" },
  { value: "keepFirst", label: "Keep First", description: "Use first non-empty value", expression: "$input1" },
  { value: "keepLast", label: "Keep Last", description: "Use last non-empty value", expression: "$inputN" },
  { value: "combine", label: "Combine", description: "Merge objects (later keys overwrite)", expression: "$merge([$input1, $input2, ...])" },
  { value: "custom", label: "Custom Expression", description: "Write your own JSONata expression", expression: "Your expression" },
] as const;

/**
 * Settings form for the Merge Node.
 * Allows users to configure the merge mode and input sources.
 */
export function MergeSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: MergeSettingsFormProps) {
  // Ensure defaultValues has at least 2 sources
  const normalizedDefaultValues = {
    name: defaultValues?.name || "",
    mode: defaultValues?.mode || "append",
    sources: defaultValues?.sources && defaultValues.sources.length >= 2
      ? defaultValues.sources
      : [
          { id: "source-1", label: "Source 1" },
          { id: "source-2", label: "Source 2" }
        ],
    keyField: defaultValues?.keyField || "",
    includeAllFields: defaultValues?.includeAllFields ?? false,
    expression: defaultValues?.expression || "",
  };

  const form = useForm<MergeSettingsFormValues>({
    resolver: zodResolver(mergeSettingsSchemaRefined),
    defaultValues: normalizedDefaultValues,
    mode: "onSubmit", // Use onSubmit mode to avoid premature validation
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "sources",
  });

  const mode = form.watch("mode");

  const handleSubmit = (values: MergeSettingsFormValues) => {
    console.log("MergeSettingsForm submitting:", values);
    onSubmit(values);
  };

  const addSource = () => {
    const nextId = `source-${Date.now()}`;
    append({ id: nextId, label: `Source ${fields.length + 1}` });
  };

  const removeSource = (index: number) => {
    if (fields.length > 2) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <GitMerge className="size-5" />
              Merge Node Configuration
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure how to merge data from multiple workflow branches using JSONata
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Merge" {...field} />
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
                <FormLabel>Merge Mode</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select merge mode" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mergeModes.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        <div className="flex flex-col items-start">
                          <div className="flex items-center gap-2">
                            <span>{mode.label}</span>
                            {mode.value === "custom" && <Code2 className="size-3 text-muted-foreground" />}
                          </div>
                          <span className="text-xs text-muted-foreground">{mode.description}</span>
                          {mode.expression && (
                            <code className="text-[10px] bg-muted px-1 rounded font-mono">
                              {mode.expression}
                            </code>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  How to combine data from all input sources
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {mode === "mergeByKey" && (
            <FormField
              control={form.control}
              name="keyField"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Field</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="id"
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The field name to join data on (e.g., "id", "userId", "email").
                    Use dot notation for nested fields like "user.id".
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {mode === "custom" && (
            <FormField
              control={form.control}
              name="expression"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>JSONata Expression</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='$append($input1, $input2, $input3)'
                      className='font-mono text-sm min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Write a JSONata expression to merge data. Available variables:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$input1, $input2, $input3, ...</code>
                    {" "} Examples:{" "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$append($input1, $input2)</code>
                    {", "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$merge([$input1, $input2])</code>
                    {", "}
                    <code className="text-xs bg-muted px-1 py-0.5 rounded">$zip([$input1, $input2])</code>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Input Sources</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSource}
              >
                <Plus className="size-4 mr-1" />
                Add Source
              </Button>
            </div>
            <FormDescription>
              Enter the exact node names as shown on the canvas. Connected node names are
              auto-filled, but you can edit them manually if needed.
            </FormDescription>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-md bg-muted/30"
                >
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name={`sources.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Source {index + 1}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., HTTP Request 1"
                              className="font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Enter the exact node name as shown on the canvas
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSource(index)}
                    disabled={fields.length <= 2}
                    className="mt-1"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {mode === "mergeByKey" && (
            <FormField
              control={form.control}
              name="includeAllFields"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Include all fields</FormLabel>
                    <FormDescription>
                      When enabled, all fields from matched records will be included in the result
                    </FormDescription>
                  </div>
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
