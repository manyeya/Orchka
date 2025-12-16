"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Plus, Trash2 } from "lucide-react";
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

const switchCaseSchema = z.object({
  id: z.string(),
  value: z.string().min(1, "Case value is required"),
  label: z.string().min(1, "Case label is required"),
});

const switchSettingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  expression: z.string().min(1, "Expression is required"),
  cases: z.array(switchCaseSchema).min(1, "At least one case is required"),
});

export type SwitchSettingsFormValues = z.infer<typeof switchSettingsSchema>;

interface SwitchSettingsFormProps {
  defaultValues?: Partial<SwitchSettingsFormValues>;
  onSubmit: (values: SwitchSettingsFormValues) => void;
  onCancel?: () => void;
}


/**
 * Settings form for the Switch Node.
 * Allows users to configure the node name, expression, and case definitions.
 */
export function SwitchSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: SwitchSettingsFormProps) {
  const form = useForm<SwitchSettingsFormValues>({
    resolver: zodResolver(switchSettingsSchema),
    defaultValues: {
      name: "",
      expression: "",
      cases: [{ id: "case-1", value: "", label: "Case 1" }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "cases",
  });

  const handleSubmit = (values: SwitchSettingsFormValues) => {
    onSubmit(values);
  };

  const addCase = () => {
    const nextId = `case-${fields.length + 1}`;
    append({ id: nextId, value: "", label: `Case ${fields.length + 1}` });
  };

  const removeCase = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Switch Node Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Configure the expression and cases for routing workflow execution
            </p>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Switch" {...field} />
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
            name="expression"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expression</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='{{ $json.type }}'
                    className="font-mono text-sm min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  An expression that evaluates to a value to match against cases.
                  Use{" "}
                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                    {"{{ }}"}
                  </code>{" "}
                  syntax for dynamic values.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Cases</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCase}
              >
                <Plus className="size-4 mr-1" />
                Add Case
              </Button>
            </div>
            <FormDescription>
              Define the cases to match against. The first matching case will be executed.
              If no case matches, the default branch will be taken.
            </FormDescription>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex gap-2 items-start p-3 border rounded-md bg-muted/30"
                >
                  <div className="flex-1 space-y-2">
                    <FormField
                      control={form.control}
                      name={`cases.${index}.label`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder="Label" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`cases.${index}.value`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Value to match"
                              className="font-mono text-sm"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCase(index)}
                    disabled={fields.length <= 1}
                    className="mt-1"
                  >
                    <Trash2 className="size-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
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
