import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import {
	AccountRecovery,
	StringAttribute,
	UserPool,
	VerificationEmailStyle,
} from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import {GraphqlApi, Resolver} from "aws-cdk-lib/aws-appsync";
import {RustFunction} from "cargo-lambda-cdk";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const userPool = this.userPool();
		this.userPoolClient(userPool);
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
			authFlows: {
				userPassword: true,
				userSrp: true,
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
			runtime: "provided.al2023"
		})
		const dataSource = api.addLambdaDataSource("demo-lambda-data-source", resolver);
		dataSource.createResolver("get-demos", {
			typeName: "Query",
			fieldName: "getDemos",
		})
	}
}
