import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { GraphqlApi } from "aws-cdk-lib/aws-appsync";
import {
	AccountRecovery,
	OAuthScope,
	ProviderAttribute,
	StringAttribute,
	UserPool,
	UserPoolClientIdentityProvider,
	UserPoolIdentityProviderGoogle,
	VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { RustFunction } from "cargo-lambda-cdk";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const userPool = this.userPool();
		this.userPoolClient(userPool);
		this.addGoogleAuth(userPool);
		const api = this.appSync(userPool);
		this.resolvers(api);
	}

	userPool() {
		return new UserPool(this, "UserPool", {
			userPoolName: "next-cog",
			selfSignUpEnabled: true,
			signInAliases: {
				email: true,
				username: false,
				phone: false,
			},
			autoVerify: { email: true },
			userVerification: {
				emailStyle: VerificationEmailStyle.CODE,
			},
			customAttributes: {
				name: new StringAttribute({ minLen: 1, maxLen: 256, mutable: true }),
			},
			accountRecovery: AccountRecovery.EMAIL_ONLY,
			removalPolicy: RemovalPolicy.DESTROY,
		});
	}

	userPoolClient(userPool: UserPool) {
		userPool.addClient("next-app-client", {
			userPoolClientName: "next-front",
			supportedIdentityProviders: [
				UserPoolClientIdentityProvider.GOOGLE,
				UserPoolClientIdentityProvider.COGNITO,
			],
			authFlows: {
				userPassword: true,
				userSrp: true,
			},
			oAuth: {
				flows: {
					authorizationCodeGrant: true,
				},
				scopes: [
					OAuthScope.EMAIL,
					OAuthScope.OPENID,
					OAuthScope.PROFILE,
					OAuthScope.COGNITO_ADMIN,
				],
				callbackUrls: [
					"http://localhost:3000/login",
					"https://next-auth-testtesttesttest.auth.us-west-2.amazoncognito.com",
				],
			},
		});
	}

	addGoogleAuth(userPool: UserPool) {
		userPool.addDomain("CognitoDomain", {
			cognitoDomain: {
				domainPrefix: "next-auth-testtesttesttest",
			},
		});

		const provider = Secret.fromSecretNameV2(
			this,
			"google-secret",
			"oauth/google/keys",
		);

		new UserPoolIdentityProviderGoogle(this, "GoogleProvider", {
			userPool,
			clientId: provider.secretValueFromJson("clientId").unsafeUnwrap(),
			clientSecretValue: provider.secretValueFromJson("clientSecret"),
			scopes: ["profile", "email", "openid"],
			attributeMapping: {
				email: ProviderAttribute.GOOGLE_EMAIL,
				nickname: ProviderAttribute.GOOGLE_NAME,
			},
		});
	}

	appSync(userPool: UserPool) {
		return new appsync.GraphqlApi(this, "AppSync", {
			name: "next-app-api",
			definition: appsync.Definition.fromFile(
				path.join(__dirname, "../graphql/schema.graphql"),
			),
			authorizationConfig: {
				defaultAuthorization: {
					authorizationType: appsync.AuthorizationType.USER_POOL,
					userPoolConfig: {
						userPool,
					},
				},
			},
		});
	}

	resolvers(api: GraphqlApi) {
		const resolver = new RustFunction(this, "demo-function", {
			functionName: "demo-app-sync-function",
			manifestPath: path.join(__dirname, "../graphql/resolver/Cargo.toml"),
			runtime: "provided.al2023",
		});
		const dataSource = api.addLambdaDataSource(
			"demo-lambda-data-source",
			resolver,
		);
		dataSource.createResolver("get-demos", {
			typeName: "Query",
			fieldName: "getDemos",
		});
	}
}
