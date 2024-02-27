import { generateClient } from "@aws-amplify/api";
import { configureClientAmplify } from '../apmlify/amplifySetting.client'

configureClientAmplify();
export const client = generateClient()