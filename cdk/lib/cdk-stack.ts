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

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const userPool = this.userPool();
		this.userPoolClient(userPool);
		this.appSync(userPool);
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
}
