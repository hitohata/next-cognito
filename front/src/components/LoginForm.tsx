"use client";

import { getToken } from "@/lib/api/auth/authToken.client";
import { configureClientAmplify } from "@/utils/apmlify/amplifySetting.client";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Hub } from "@aws-amplify/core";

configureClientAmplify();

export const LoginForm = () => {
	const router = useRouter();

	const checkSession = useCallback(async () => {
		const idToken = await getToken();
		if (idToken) {
			router.push("/ssr-page");
		}
	}, [router]);

	useEffect(() => {
		checkSession();
	}, []);

	// watch an auth events
	// when sign in is completed, redirect to the '/ssr-page'
	useEffect(() => {
		Hub.listen("auth", (data) => {
			if (data?.payload?.event === "signedIn") {
				router.push("/ssr-page");
			}
		})
	}, [])

	return <Authenticator loginMechanisms={["email"]} socialProviders={['google']} />;
};
