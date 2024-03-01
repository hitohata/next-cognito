import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { SignatureV4 } from "@smithy/signature-v4";

const APPSYNC_URL = process.env.URL!;

const document = {
	query: `
        mutation AddDemo {
            addDemo(input: {version: "version"}) {
                id
                version
            }
         }`,
	operationName: "AddDemo",
	variables: {},
};

export const handler = async () => {
	const { headers, body, method } = await sign();

	const res = await (
		await fetch(APPSYNC_URL, {
			method: method,
			headers,
			body,
		})
	).json();

	console.log(res);
	return res;
};

const sign = async () => {
	const url = new URL(APPSYNC_URL);

	const signer = new SignatureV4({
		service: "appsync",
		region: process.env.AWS_REGION!,
		credentials: defaultProvider(),
		sha256: Sha256,
	});

	return await signer.sign({
		method: "POST",
		hostname: url.host,
		path: url.pathname,
		protocol: url.protocol,
		headers: {
			"Content-Type": "application/json",
			host: url.hostname,
		},
		body: JSON.stringify(document),
	});
};
