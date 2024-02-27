'use client'

import {GraphQLResult} from "@aws-amplify/api-graphql";
import {GetDemosQuery} from "@/API";
import {useEffect, useState} from "react";
import {DemoComponent} from "@/components/DemoComponent";
import { client } from '@/utils/client/clientClient'

const getDemosQuery = `
    query GetDemos {
      getDemos {
        id
        version
        __typename
      }
    }
`

export const ClientDemos = () => {

    const [demos, setDemos] = useState<GetDemosQuery | null>(null)

    useEffect(() => {
        fetchDemos()
    }, [])

    const fetchDemos = async () => {
        const result = await client.graphql({
            query: getDemosQuery
        }) as GraphQLResult<GetDemosQuery>
        setDemos(result.data)
    }

    return (
        <>
            <h2>Client Side Rendering</h2>
            {demos?.getDemos && demos.getDemos.map((el, index) => <DemoComponent {...el} key={index}/>)}
        </>
    )

}