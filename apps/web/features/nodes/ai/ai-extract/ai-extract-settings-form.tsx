"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { Slider } from "@/components/ui/slider";
import { FileJson, Key } from "lucide-react";
import { aiExtractSettingsSchema, type AIExtractSettings, EXTRACTION_TEMPLATES } from "./types";
import { ALL_MODELS, getExpectedCredentialType } from "../shared/model-factory";
import { CredentialSelector } from "@/features/credentials/components/credential-selector";

interface AIExtractSettingsFormProps {
  defaultValues?: Partial<AIExtractSettings>;
  onSubmit: (values: AIExtractSettings) => void;
  onCancel?: () => void;
}

export function AIExtractSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: AIExtractSettingsFormProps) {
  const form = useForm<AIExtractSettings>({
    resolver: zodResolver(aiExtractSettingsSchema),
    defaultValues: {
      name: "AI Extract",
      model: "gpt-4o",
      systemPrompt: "Extract the requested information from the input.",
      prompt: "",
      outputSchema: EXTRACTION_TEMPLATES.entity.schema,
      temperature: 0.3,
      ...defaultValues,
    },
  });

  const selectedModel = form.watch("model");
  const credentialType = getExpectedCredentialType(selectedModel);

  const applyTemplate = (templateKey: keyof typeof EXTRACTION_TEMPLATES) => {
    form.setValue("outputSchema", EXTRACTION_TEMPLATES[templateKey].schema);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 pr-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">AI Extract</h3>
              <p className="text-sm text-muted-foreground">
                Structured data extraction using AI SDK
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
                  <Input placeholder="AI Extract" {...field} />
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
                    placeholder="Enter text to extract from or use {{ expressions }}..."
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
            <FormLabel>Schema Templates</FormLabel>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Object.entries(EXTRACTION_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate(key as keyof typeof EXTRACTION_TEMPLATES)}
                >
                  {template.name}
                </Button>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="outputSchema"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Output Schema (JSON Schema)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="JSON Schema..."
                    className="min-h-[150px] font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Define the structure of extracted data using JSON Schema
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperature: {field.value}</FormLabel>
                <FormControl>
                  <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[field.value]}
                    onValueChange={([value]) => field.onChange(value)}
                  />
                </FormControl>
                <FormDescription>Lower values for more consistent extraction</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
