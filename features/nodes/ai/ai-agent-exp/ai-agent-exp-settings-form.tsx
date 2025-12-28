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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BotMessageSquare, Key, Wrench, Code, Settings2, Plus, Trash2 } from "lucide-react";
import { aiAgentExpSettingsSchema, type AIAgentExpSettings } from "./types";
import { ALL_MODELS, getExpectedCredentialType } from "../shared/model-factory";
import { CredentialSelector } from "@/features/credentials/components/credential-selector";

interface AIAgentExpSettingsFormProps {
  defaultValues?: Partial<AIAgentExpSettings>;
  onSubmit: (values: AIAgentExpSettings) => void;
  onCancel?: () => void;
}

export function AIAgentExpSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: AIAgentExpSettingsFormProps) {
  const form = useForm<AIAgentExpSettings>({
    resolver: zodResolver(aiAgentExpSettingsSchema),
    defaultValues: {
      name: "AI Agent",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant that can use tools to accomplish tasks.",
      prompt: "",
      maxSteps: 10,
      enabledTools: [],
      customTools: [],
      outputFormat: "text",
      temperature: 0.7,
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customTools",
  });

  const selectedModel = form.watch("model");
  const enabledTools = form.watch("enabledTools");
  const credentialType = getExpectedCredentialType(selectedModel);

  const toggleTool = (toolName: "http" | "calculator" | "code") => {
    const current = form.getValues("enabledTools");
    if (current.includes(toolName)) {
      form.setValue("enabledTools", current.filter((t) => t !== toolName));
    } else {
      form.setValue("enabledTools", [...current, toolName]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 pr-4">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">AI Agent (AI SDK)</h3>
              <p className="text-sm text-muted-foreground">
                Tool-using agent with durable execution
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
                  <Input placeholder="AI Agent" {...field} />
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
            name="systemPrompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>System Prompt</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="You are a helpful assistant..."
                    className="min-h-[80px] font-mono text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools" className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                Custom
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="space-y-4 pt-4">
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("http") ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleTool("http")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">HTTP Request</span>
                      <Badge variant="secondary" className="text-xs">httpRequest</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Make HTTP requests to external APIs</p>
                  </div>
                  <Switch checked={enabledTools.includes("http")} />
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("calculator") ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleTool("calculator")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Calculator</span>
                      <Badge variant="secondary" className="text-xs">calculator</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Perform mathematical operations</p>
                  </div>
                  <Switch checked={enabledTools.includes("calculator")} />
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("code") ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => toggleTool("code")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Code Evaluation</span>
                      <Badge variant="secondary" className="text-xs">evaluateExpression</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Evaluate JavaScript expressions</p>
                  </div>
                  <Switch checked={enabledTools.includes("code")} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Custom Tools</h4>
                  <p className="text-xs text-muted-foreground">Define tools with HTTP endpoints</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ name: "", description: "", parametersSchema: "{}", endpoint: "" })}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                  No custom tools. Click &quot;Add Tool&quot; to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tool {index + 1}</span>
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <Input placeholder="Tool name" {...form.register(`customTools.${index}.name`)} />
                      <Input placeholder="Description" {...form.register(`customTools.${index}.description`)} />
                      <Input placeholder="Endpoint URL" {...form.register(`customTools.${index}.endpoint`)} />
                      <Textarea
                        placeholder='{"type": "object", "properties": {...}}'
                        className="font-mono text-sm"
                        {...form.register(`customTools.${index}.parametersSchema`)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter your prompt..." className="min-h-[80px]" {...field} />
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

              <FormField
                control={form.control}
                name="maxSteps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Steps</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Maximum tool calls before stopping (1-50)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outputFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Output Format</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="json">JSON</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
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
