import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Duration, RemovalPolicy } from "aws-cdk-lib";
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
import * as iam from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { RustFunction } from "cargo-lambda-cdk";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const preSignupFunction = this.preSignupFunction();
		const postSignupFunction = this.postSignupFunction();
		const userPool = this.userPool(preSignupFunction, postSignupFunction);
		this.userPoolClient(userPool);
		this.addGoogleAuth(userPool);
		const api = this.appSync(userPool);
		this.resolvers(api);
		this.gqlClient(api);
	}

	userPool(
		preSignupFunction: NodejsFunction,
		postSignupFunction: NodejsFunction,
	) {
		const userPool = new UserPool(this, "UserPool", {
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
			lambdaTriggers: {
				preSignUp: preSignupFunction,
				postConfirmation: postSignupFunction,
			},
		});

		preSignupFunction.role?.attachInlinePolicy(
			new iam.Policy(this, "pre-signup-policy", {
				statements: [
					new iam.PolicyStatement({
						actions: [
							"cognito-idp:ListUsers",
							"cognito-idp:AdminLinkProviderForUser",
							"cognito-idp:AdminConfirmSignUp",
							"cognito-idp:AdminCreateUser",
							"cognito-idp:AdminSetUserPassword",
						],
						resources: [userPool.userPoolArn],
					}),
				],
			}),
		);

		return userPool;
	}

	userPoolClient(userPool: UserPool) {
		userPool.addClient("next-app-client", {
			userPoolClientName: "next-front",
			supportedIdentityProviders: [
				UserPoolClientIdentityProvider.GOOGLE,
				UserPoolClientIdentityProvider.COGNITO,
			],
			authFlows: {
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
				logoutUrls: ["http://localhost:3000/login"],
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
				custom: {
					email_verified: ProviderAttribute.other("email_verified"),
				},
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
				additionalAuthorizationModes: [
					{
						authorizationType: appsync.AuthorizationType.IAM,
					},
				],
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
		dataSource.createResolver("add-demos", {
			typeName: "Mutation",
			fieldName: "addDemo",
		});
	}

	preSignupFunction() {
		return new NodejsFunction(this, "pre-signup-function", {
			functionName: "pre-signup-function",
			entry: path.join(__dirname, "../lambda/preSignup/src/index.ts"),
			handler: "handler",
			runtime: Runtime.NODEJS_20_X,
			depsLockFilePath: path.join(
				__dirname,
				"../lambda/preSignup/package-lock.json",
			),
			timeout: Duration.seconds(5),
		});
	}

	postSignupFunction() {
		return new NodejsFunction(this, "post-confirmation-function", {
			functionName: "post-confirmation-function",
			entry: path.join(__dirname, "../lambda/signup/src/index.ts"),
			handler: "handler",
			runtime: Runtime.NODEJS_20_X,
			depsLockFilePath: path.join(
				__dirname,
				"../lambda/signup/package-lock.json",
			),
			timeout: Duration.seconds(5),
		});
	}

	gqlClient(api: GraphqlApi) {
		const client = new NodejsFunction(this, "iamAppSyncClient", {
			functionName: "iam-app-sync-client",
			entry: path.join(__dirname, "../lambda/iamAppSync/src/index.ts"),
			handler: "handler",
			runtime: Runtime.NODEJS_20_X,
			depsLockFilePath: path.join(
				__dirname,
				"../lambda/iamAppSync/package-lock.json",
			),
			timeout: Duration.seconds(5),
			environment: {
				URL: api.graphqlUrl,
			},
		});
		//
		// client.role?.attachInlinePolicy(
		// 	new iam.Policy(this, "iam-app-sync-policy", {
		// 		statements: [
		// 			new iam.PolicyStatement({
		// 				actions: ["appsync:GraphQL"],
		// 				resources: [`${api.arn}/*`],
		// 			}),
		// 		],
		// 	}),
		// );

		const role = new iam.Role(this, "role", {
			assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")
		});
		api.grant(role, appsync.IamResource.custom("/*"), 'appsync:GraphQL')
	}
}
