"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { httpNodeChannel } from "./channel";
import { inngest } from "@/inngest/client";


export type HTTPRequestToken = Realtime.Token<typeof httpNodeChannel, ['status']>;

export const getHTTPRequestToken = async (): Promise<HTTPRequestToken> => {
    const token = await getSubscriptionToken(inngest,{
        channel: httpNodeChannel(),
        topics: ['status']
    });
    return token;   
}