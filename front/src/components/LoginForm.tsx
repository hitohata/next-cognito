"use client";

import { getToken } from "@/lib/api/auth/authToken.client";
import { configureClientAmplify } from "@/utils/apmlify/amplifySetting.client";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

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

	return <Authenticator loginMechanisms={["email"]} />;
};
