import { cookies } from "next/headers";
import { generateServerClientUsingCookies } from "@aws-amplify/adapter-nextjs/api"
import { amplifyConfig } from "@/utils/apmlify/amplifyConfig";

export const serverClient = generateServerClientUsingCookies({
    config: amplifyConfig,
    cookies
});