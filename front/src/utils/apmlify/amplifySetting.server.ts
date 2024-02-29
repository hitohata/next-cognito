import { createServerRunner } from "@aws-amplify/adapter-nextjs";
import { amplifyConfig } from "./amplifyConfig";

/**
 * configure Amplify setting for Client Component
 */
export const { runWithAmplifyServerContext } = createServerRunner({
	config: amplifyConfig,
});
