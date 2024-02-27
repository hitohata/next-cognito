import {serverClient} from "@/utils/client/serverClient";
import {GetDemosQuery} from "@/API";
import {GraphQLResult} from "@aws-amplify/api-graphql";
import {DemoComponent} from "@/components/DemoComponent";
import {ClientDemos} from "@/components/ClientDemos";

export const dynamic = 'force-dynamic';

const getDemos = `
    query GetDemos {
      getDemos {
        id
        version
        __typename
      }
    }
`

export default async function SSRPage() {

    const { data, errors } = await serverClient.graphql({
        query: getDemos
    }) as GraphQLResult<GetDemosQuery>

    if (errors) {
        return (
            <>
                {errors.map((el, index) => <p key={ index }>el</p>)}
            </>
        )

    }

     return (
         <>
             <div>Server Side Rendering</div>
             {data.getDemos?.map((el, index) => (
                     <div key={index}>
                         <DemoComponent {...el} />
                     </div>
                 )
             )}
             <ClientDemos />
         </>
     )
}
