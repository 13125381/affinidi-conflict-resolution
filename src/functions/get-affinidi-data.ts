import { APIGatewayEvent } from 'aws-lambda';
import { httpResponse } from '../lib/utils/http-helper';
import { getPersonalInformation } from '../lib/entities/personal-information';
import { generateResponseData } from '../lib/utils/etag';

export const handler = async (event: APIGatewayEvent) => {
    const did = event.requestContext.identity.user;
    if (!did) {
        return httpResponse(401)
    }
    const personalInformation = getPersonalInformation(did);
    const { body, headers } = generateResponseData(personalInformation);
    return httpResponse(200, body, headers)
};