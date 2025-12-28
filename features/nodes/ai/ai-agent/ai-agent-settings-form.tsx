"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Bot, Wrench, Settings2, Code } from "lucide-react";
import {
  aiAgentSettingsSchema,
  ALL_MODELS,
} from "./types";

export type AIAgentSettingsFormValues = z.infer<typeof aiAgentSettingsSchema>;

interface AIAgentSettingsFormProps {
  defaultValues?: Partial<AIAgentSettingsFormValues>;
  onSubmit: (values: AIAgentSettingsFormValues) => void;
  onCancel?: () => void;
}

export function AIAgentSettingsForm({
  defaultValues,
  onSubmit,
  onCancel,
}: AIAgentSettingsFormProps) {
  const form = useForm<AIAgentSettingsFormValues>({
    resolver: zodResolver(aiAgentSettingsSchema),
    defaultValues: {
      name: "AI Agent",
      model: "gpt-4o",
      systemPrompt: "You are a helpful assistant.",
      maxIterations: 10,
      enabledTools: [],
      customTools: [],
      prompt: "",
      inputVariable: "",
      outputFormat: "text",
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "customTools",
  });

  const enabledTools = form.watch("enabledTools");

  const toggleTool = (toolName: "http" | "code" | "calculator") => {
    const current = form.getValues("enabledTools");
    if (current.includes(toolName)) {
      form.setValue(
        "enabledTools",
        current.filter((t) => t !== toolName)
      );
    } else {
      form.setValue("enabledTools", [...current, toolName]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 pr-4">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">AI Agent Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure your AI agent with tools and behavior
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
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        OpenAI
                      </div>
                      {ALL_MODELS.filter((m) => m.value.startsWith("gpt-")).map(
                        (model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        )
                      )}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Anthropic
                      </div>
                      {ALL_MODELS.filter((m) => m.value.startsWith("claude-")).map(
                        (model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        )
                      )}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Google
                      </div>
                      {ALL_MODELS.filter((m) => m.value.startsWith("gemini-")).map(
                        (model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        )
                      )}
                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Groq
                      </div>
                      {ALL_MODELS.filter(
                        (m) =>
                          m.value.startsWith("llama-") ||
                          m.value.startsWith("mixtral-") ||
                          m.value.startsWith("gemma")
                      ).map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The LLM model to power the agent
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="systemPrompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="You are a helpful assistant..."
                      className="min-h-[100px] font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Instructions that define the agent&apos;s behavior
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Tabs */}
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools" className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                Tools
              </TabsTrigger>
              <TabsTrigger value="custom" className="flex items-center gap-1">
                <Code className="h-3 w-3" />
                Custom Tools
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-1">
                <Settings2 className="h-3 w-3" />
                Advanced
              </TabsTrigger>
            </TabsList>

            {/* Built-in Tools Tab */}
            <TabsContent value="tools" className="space-y-4 pt-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Built-in Tools</h4>
                <p className="text-xs text-muted-foreground mb-4">
                  Enable tools the agent can use to accomplish tasks
                </p>
              </div>

              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("http")
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => toggleTool("http")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">HTTP Request</span>
                      <Badge variant="secondary" className="text-xs">
                        http_request
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Make HTTP requests to external APIs
                    </p>
                  </div>
                  <Switch checked={enabledTools.includes("http")} />
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("code")
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => toggleTool("code")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Code Evaluation</span>
                      <Badge variant="secondary" className="text-xs">
                        evaluate_expression
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Evaluate JavaScript expressions
                    </p>
                  </div>
                  <Switch checked={enabledTools.includes("code")} />
                </div>

                <div
                  className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-colors ${
                    enabledTools.includes("calculator")
                      ? "border-primary bg-primary/5"
                      : ""
                  }`}
                  onClick={() => toggleTool("calculator")}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Calculator</span>
                      <Badge variant="secondary" className="text-xs">
                        calculator
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Perform mathematical operations
                    </p>
                  </div>
                  <Switch checked={enabledTools.includes("calculator")} />
                </div>
              </div>
            </TabsContent>

            {/* Custom Tools Tab */}
            <TabsContent value="custom" className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold">Custom Tools</h4>
                  <p className="text-xs text-muted-foreground">
                    Define custom tools with HTTP endpoints
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      name: "",
                      description: "",
                      schema: "{}",
                      endpoint: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tool
                </Button>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border rounded-lg">
                  No custom tools defined. Click &quot;Add Tool&quot; to create one.
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Tool {index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name={`customTools.${index}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="my_custom_tool"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`customTools.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="What this tool does..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`customTools.${index}.endpoint`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Endpoint URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://api.example.com/tool"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              POST endpoint that receives tool arguments
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`customTools.${index}.schema`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parameters Schema (JSON)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='{"param1": {"description": "First parameter"}}'
                                className="font-mono text-sm"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Advanced Tab */}
            <TabsContent value="advanced" className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your prompt here..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Direct prompt to send to the agent
                    </FormDescription>
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
                    <FormDescription>
                      Or use a context variable as input (overrides prompt if set)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxIterations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Iterations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={50}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of tool calls before stopping (1-50)
                    </FormDescription>
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
                    <FormDescription>
                      How to format the agent&apos;s output
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit">Save Configuration</Button>
        </div>
      </form>
    </Form>
  );
}
