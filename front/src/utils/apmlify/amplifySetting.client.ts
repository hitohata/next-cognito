import { Amplify } from "aws-amplify";
import { amplifyConfig } from "@/utils/apmlify/amplifyConfig";

/**
 * configure Amplify setting for Client Component
 */
export const configureClientAmplify = () => {
	Amplify.configure(
		amplifyConfig,
		{ ssr: true },
	);
};
