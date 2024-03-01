import {
	PostAuthenticationTriggerHandler,
	PostConfirmationConfirmSignUpTriggerEvent,
} from "aws-lambda";

export const handler = async (
	event: PostConfirmationConfirmSignUpTriggerEvent,
) => {
	console.log(event);
	return event;
};
