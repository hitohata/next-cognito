import {
	AdminCreateUserCommand,
	AdminCreateUserCommandInput,
	AdminLinkProviderForUserCommand,
	AdminLinkProviderForUserCommandInput,
	AdminSetUserPasswordCommand,
	AdminSetUserPasswordCommandInput,
	CognitoIdentityProviderClient,
	ListUsersCommand,
	UserType,
} from "@aws-sdk/client-cognito-identity-provider";
import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from "aws-lambda";
import { generate } from "generate-password";

export const handler: PreSignUpTriggerHandler = async (
	event: PreSignUpTriggerEvent,
	context,
	callback,
) => {
	const { userPoolId, userName, triggerSource, request } = event;

	try {
		if (triggerSource === "PreSignUp_AdminCreateUser") {
			event.response.autoConfirmUser = true;
			return callback(null, event);
		}

		if (triggerSource !== "PreSignUp_ExternalProvider") {
			return callback(null, event);
		}

		// when login using an external provider, like Google
		const emailAddress = request.userAttributes.email;

		const existingUsers = await getUserDate({ userPoolId, emailAddress });

		const [providerName, providerId] = userName.split("_");

		// convert provider name from 'google' to 'Google'
		const providerNameWithCapital =
			providerName.charAt(0).toUpperCase() + providerName.slice(1);

		// if user already exists, then link the external ipd to a user pool client.
		if (existingUsers.length > 0) {
			const username = existingUsers[0].Username || "new user";

			await Promise.all([
				adminLink({
					userPoolId,
					username,
					providerName: providerNameWithCapital,
					providerUserId: providerId,
				}),
			]);

			event.response.autoConfirmUser = true;
			return callback(null, event);
		}

		// if user is not exists
		const newUser = await createCognitoUser({
			userPoolId,
			name: request.userAttributes.nickname,
			email: emailAddress,
		});

		const username = newUser.User?.Username || "no-user-name";

		await Promise.all([
			setupUserPassword({
				userPoolId,
				username,
			}),
			adminLink({
				userPoolId,
				username,
				providerName: providerNameWithCapital,
				providerUserId: providerId,
			}),
		]);

		event.response.autoConfirmUser = true;
		return callback(null, event);
	} catch (e) {
		console.error(e);
		if (e instanceof Error) {
			return callback(e.message, event);
		}
		callback(JSON.stringify(e), event);
	}
};

const getUserDate = async ({
	userPoolId,
	emailAddress,
}: { userPoolId: string; emailAddress: string }): Promise<UserType[]> => {
	const client = new CognitoIdentityProviderClient();
	const input = {
		UserPoolId: userPoolId,
		Filter: `email = "${emailAddress}"`,
	};
	const command = new ListUsersCommand(input);
	const result = await client.send(command);

	if (result.Users && result.Users.length > 0) {
		return result.Users;
	}

	return [];
};

interface IAdminLinkProps {
	userPoolId: string;
	username: string;
	providerName: string;
	providerUserId: string;
}
const adminLink = async (userDetail: IAdminLinkProps) => {
	const { userPoolId, username, providerName, providerUserId } = userDetail;

	const client = new CognitoIdentityProviderClient();
	const input: AdminLinkProviderForUserCommandInput = {
		UserPoolId: userPoolId,
		DestinationUser: {
			ProviderName: "Cognito",
			ProviderAttributeValue: username,
		},
		SourceUser: {
			ProviderAttributeName: "Cognito_Subject",
			ProviderAttributeValue: providerUserId,
			ProviderName: providerName,
		},
	};

	const command = new AdminLinkProviderForUserCommand(input);

	return await client.send(command);
};

interface IAdminCreateUserProps {
	userPoolId: string;
	name: string;
	email: string;
}
const createCognitoUser = async (newUser: IAdminCreateUserProps) => {
	const { userPoolId, name, email } = newUser;

	const client = new CognitoIdentityProviderClient();

	const input: AdminCreateUserCommandInput = {
		UserPoolId: userPoolId,
		Username: email,
		UserAttributes: [
			{
				Name: "name",
				Value: name,
			},
			{
				Name: "email",
				Value: email,
			},
		],
		MessageAction: "SUPPRESS",
	};

	const command = new AdminCreateUserCommand(input);

	return await client.send(command);
};

interface ISetupUserPasswordProps {
	userPoolId: string;
	username: string;
}
const setupUserPassword = async (target: ISetupUserPasswordProps) => {
	const { userPoolId, username } = target;

	const password = generate({
		length: 20,
		numbers: true,
		symbols: true,
		uppercase: true,
		lowercase: true,
		strict: true,
	});

	const client = new CognitoIdentityProviderClient();
	const input: AdminSetUserPasswordCommandInput = {
		UserPoolId: userPoolId,
		Username: username,
		Password: password,
		Permanent: true,
	};
	const command = new AdminSetUserPasswordCommand(input);

	return await client.send(command);
};
