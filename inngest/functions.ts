import { inngest } from "./client";
import prisma from "@/lib/db";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "15s");

    await step.run("send-email", async () => {
      return prisma.workflow.create({
            data: {
                name: "New Workflow - " + event.data.email,
            }
        })
    });

    return { message: `Hello ${event.data.email}!` };
  },
);