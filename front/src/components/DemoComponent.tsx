export const DemoComponent = ({ id, version }: { id: string, version: string }) => {
    return (
        <>
            <h2>{id}</h2>
            <h2>{version}</h2>
        </>
    )
}