import { executionParams } from "../params";
import { useQueryStates } from "nuqs";

export const useExecutionsParams = () => {
  return useQueryStates(executionParams)
}
