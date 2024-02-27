import { getToken } from "@/lib/api/auth/authToken.client";
import { generateClient } from "@aws-amplify/api";
import {useEffect, useState} from "react";
import {GraphQLResult} from "@aws-amplify/api-graphql";
import {GetDemosQuery} from "@/API";
import {GraphQLError} from "graphql";


const getDemosQuery = `
    query GetDemos {
      getDemos {
        id
        version
        __typename
      }
    }
`

type Query<T> = {loading: false, data: undefined, errors: undefined} | { loading: false, data: T, errors: undefined } | {loading: false, data: null, errors: GraphQLError[] }

const useGetDemos = async () => {

	const [state, setState] = useState<GetDemosQuery>({loading: true, data: undefined, errors: undefined})


	const token = await getToken();
	if (!token) {
		throw new Error("token not found");
	}

};
