'use client';

import { Authenticator } from '@aws-amplify/ui-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { configureClientAmplify } from '@/utils/apmlify/amplifyClientSetting';
import '@aws-amplify/ui-react/styles.css';
import {getToken} from "@/lib/api/auth/authToken.client";

configureClientAmplify();

export const LoginForm = () => {
    const router = useRouter();

  const checkSession = useCallback(async () => {
    const idToken = await getToken();
    if (idToken) {
      router.push('/some-page');
    }
  }, [router]);

  useEffect(() => {
    checkSession();
  }, []);

  return <Authenticator loginMechanisms={['email']} />
}