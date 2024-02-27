import {Amplify, ResourcesConfig} from "aws-amplify";

const OAUTH_DOMAIN = process.env.NEXT_PUBLIC_OAUTH_DOMAIN || "";
const LOCALHOST_URL = process.env.NEXT_PUBLIC_LOCALHOST_URL || "";
const OAUTH_REDIRECT_URL = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URL || "";
const USER_POOL_ID = process.env.NEXT_PUBLIC_USER_POOL_ID || "";
const USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || "";
const API_ENDPOINT = process.env.NEXT_PUBLIC_API_ENDPOINT || "";
const REGION = process.env.NEXT_PUBLIC_REGION || "";

export const clientConfig: ResourcesConfig = {
	Auth: {
		Cognito: {
			userPoolId: USER_POOL_ID,
			signUpVerificationMethod: "code", // 'code' | 'link'
			userPoolClientId: USER_POOL_CLIENT_ID,
			userAttributes: {
				name: { required: true },
			},
			// loginWith: {
			//   oauth: {
			//     domain: OAUTH_DOMAIN,
			//     scopes: ['openid'],
			//     responseType: 'code',
			//     redirectSignIn: [LOCALHOST_URL + '/login'],
			//     redirectSignOut: [LOCALHOST_URL, OAUTH_REDIRECT_URL],
			//   },
			// },
		},
	},
	API: {
		GraphQL: {
			endpoint: API_ENDPOINT,
			region: REGION,
			defaultAuthMode: "userPool",
		},
	},
}

/**
 * configure Amplify setting for Client Component
 */
export const configureClientAmplify = () => {
	Amplify.configure(
		{
			Auth: {
				Cognito: {
					userPoolId: USER_POOL_ID,
					signUpVerificationMethod: "code", // 'code' | 'link'
					userPoolClientId: USER_POOL_CLIENT_ID,
					userAttributes: {
						name: { required: true },
					},
					// loginWith: {
					//   oauth: {
					//     domain: OAUTH_DOMAIN,
					//     scopes: ['openid'],
					//     responseType: 'code',
					//     redirectSignIn: [LOCALHOST_URL + '/login'],
					//     redirectSignOut: [LOCALHOST_URL, OAUTH_REDIRECT_URL],
					//   },
					// },
				},
			},
			API: {
				GraphQL: {
					endpoint: API_ENDPOINT,
					region: REGION,
					defaultAuthMode: "userPool",
				},
			},
		},
		{ ssr: true },
	);
};
