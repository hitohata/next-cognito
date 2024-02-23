import * as path from "node:path";
import * as cdk from "aws-cdk-lib";
import { Stack } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { UserPool } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";

export class CdkStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const userPool = this.userPool(this);
	}

	userPool(stack: Stack) {
		return new UserPool(stack, "UserPool", {
			userPoolName: "next-cog",
			selfSignUpEnabled: true,
		});
	}

	appSync(stack: Stack, userPool: UserPool) {
		return new appsync.GraphqlApi(stack, "AppSync", {
			name: "next-app-api",
			definition: appsync.Definition.fromFile(
				path.join(__dirname, "../schema.graphql"),
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
