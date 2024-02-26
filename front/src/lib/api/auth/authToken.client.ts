import { configureClientAmplify } from '@/utils/apmlify/amplifyClientSetting'
import { fetchAuthSession } from 'aws-amplify/auth'

// client side setting
configureClientAmplify();

/**
 * get token from request cookie
 * If use is not authorized, the return value will be null
 * @return AuthToken that is JWT
 */
export const getToken = async () => {
    const session = await fetchAuthSession();
    return session?.tokens?.idToken?.toString() || null
}