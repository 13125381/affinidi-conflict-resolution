import { APIGatewayProxyEventHeaders } from 'aws-lambda';
import { createHash } from 'crypto';

const IF_MATCH_HEADER_KEY = 'If-Match';

export interface ResponseData {
    body: string;
    headers: { [key: string]: string };
}

export const generateETag = (data: string): string => {
    return createHash('md5')
        .update(data)
        .digest("hex");
}

export const generateResponseData = (data: any): ResponseData => {
    const stringifiedData = JSON.stringify(data);
    return {
        body: stringifiedData,
        headers: {
            'ETag': generateETag(stringifiedData)
        }
    };
}

export const getETagFromHeaders = (headers: APIGatewayProxyEventHeaders): string | undefined => {
    return headers[IF_MATCH_HEADER_KEY];
}