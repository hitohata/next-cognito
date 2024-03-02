'use client'

import { signOut } from "@aws-amplify/auth";
import { useRouter } from "next/navigation";

export const SignOutButton = () => {

    const router = useRouter()

    const handleSignOut = () => {
        signOut().then(() => {
            console.log("sign out")
            router.push('/login')
        })
    }

    return (
        <button className={"bg-red-500"} onClick={ handleSignOut }>Sign Out</button>
    )
}