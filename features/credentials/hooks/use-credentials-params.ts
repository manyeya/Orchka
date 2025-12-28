"use client"

import { credentialsParams } from "../params";
import { useQueryStates } from "nuqs";

export const useCredentialsParams = () => {
    return useQueryStates(credentialsParams)
}
