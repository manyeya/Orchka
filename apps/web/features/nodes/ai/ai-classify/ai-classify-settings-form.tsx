"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tags, Key, Plus, Trash2 } from "lucide-react";
import { aiClassifySettingsSchema, type AIClassifySettings, CLASSIFICATION_TEMPLATES } from "./types";
import { ALL_MODELS, getExpectedCredentialType } from "../shared/model-factory";
import { CredentialSelector } from "@/features/credentials/components/credential-selector";

interface AIClassifySettingsFormProps {
  defaultValues?: Partial<AIClassifySettings>;
  onSubmit: (values: AIClassifySettings) => void;
  onCancel?: () => void;
}

export function AIClassifySettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: AIClassifySettingsFormProps) {
  const form = useForm<AIClassifySettings>({
    resolver: zodResolver(aiClassifySettingsSchema),
    defaultValues: {
      name: "AI Classify",
      model: "gpt-4o-mini",
      systemPrompt: "Classify the input into one of the provided categories.",
      prompt: "",
      categories: CLASSIFICATION_TEMPLATES.sentiment.categories,
      includeConfidence: true,
      includeReasoning: false,
      temperature: 0.1,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "categories",
  });

  const selectedModel = form.watch("model");
  const credentialType = getExpectedCredentialType(selectedModel);

  const applyTemplate = (templateKey: keyof typeof CLASSIFICATION_TEMPLATES) => {
    form.setValue("categories", CLASSIFICATION_TEMPLATES[templateKey].categories);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 pr-4">
          <div className="flex items-center gap-2">
            <Tags className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">AI Classify</h3>
              <p className="text-sm text-muted-foreground">
                Classification using AI SDK
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Node Name</FormLabel>
                <FormControl>
                  <Input placeholder="AI Classify" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">OpenAI</div>
                    {ALL_MODELS.filter((m) => m.value.startsWith("gpt-") || m.value.startsWith("o")).map((model) => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Anthropic</div>
                    {ALL_MODELS.filter((m) => m.value.startsWith("claude-")).map((model) => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Google</div>
                    {ALL_MODELS.filter((m) => m.value.startsWith("gemini-")).map((model) => (
                      <SelectItem key={model.value} value={model.value}>{model.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Smaller models work well for classification</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {credentialType && (
            <FormField
              control={form.control}
              name="credentialId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Credential
                  </FormLabel>
                  <FormControl>
                    <CredentialSelector
                      type={credentialType}
                      value={field.value}
                      onChange={(config) => field.onChange(config?.credentialId)}
                      placeholder="Select API credential..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Input Text</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter text to classify or use {{ expressions }}..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="inputVariable"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Input Variable (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., HTTP Request.data" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Category Templates</FormLabel>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(CLASSIFICATION_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(key as keyof typeof CLASSIFICATION_TEMPLATES)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <FormLabel>Categories</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ value: "", label: "", description: "" })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start border rounded-lg p-3">
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Value (e.g., positive)"
                    {...form.register(`categories.${index}.value`)}
                  />
                  <Input
                    placeholder="Label (e.g., Positive)"
                    {...form.register(`categories.${index}.label`)}
                  />
                  <Input
                    placeholder="Description (optional)"
                    {...form.register(`categories.${index}.description`)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 2}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <FormField
              control={form.control}
              name="includeConfidence"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Include Confidence Score</FormLabel>
                    <FormDescription>Add a 0-1 confidence score</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="includeReasoning"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Include Reasoning</FormLabel>
                    <FormDescription>Add explanation for classification</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          )}
          <Button type="submit">Save Configuration</Button>
        </div>
      </form>
    </Form>
  );
}
