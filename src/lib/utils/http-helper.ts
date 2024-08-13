export const httpResponse = (
    statusCode: number,
    body?: string,
    headers?: {[key: string]: string},
) => {
    return {
        body,
        headers: { 
            'Access-Control-Allow-Origin': '*',
            ...headers
        },
        statusCode
    };
}