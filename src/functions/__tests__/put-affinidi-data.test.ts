import { APIGatewayEvent, APIGatewayProxyEventHeaders } from 'aws-lambda';
import * as putAffinidiDataFns from '../put-affinidi-data';
import { IPersonalInformation } from '../../lib/types/personal-information';
import * as etagUtils from '../../lib/utils/etag';
import * as personalInformationEntity from '../../lib/entities/personal-information';

const mockRequestETag = 'mock-request-etag';

const mockPersonalInformation: IPersonalInformation = {
    did: 'offlineContext_user',
    credentialSubject: {
        person: {
            email: 'test@test.com'
        },
        categories: {
            fitness: {
                fitnessGoals: [
                    'Run faster'
                ],
                activities: [
                    {
                        activity: 'Walking',
                        frequency: 'Weekly'
                    }
                ]
            }
        }
    }
};

const mockSuccessMergeConflictResult: putAffinidiDataFns.MergeConflictResult = {
    data: mockPersonalInformation,
    status: putAffinidiDataFns.MergeConflictStatus.SUCCESSFUL
}

const mockEventBody = {
    personalInformation: mockPersonalInformation,
    autoResolve: true
}

const getEvent = (
    requestBody?: any,
    headers?: APIGatewayProxyEventHeaders
) => {
    return {
        headers: headers ?? {
            'If-Match': mockRequestETag
        },
        requestContext: {
            identity: {
                user: 'mock-did'
            }
        },
        body: requestBody ? JSON.stringify(requestBody) : JSON.stringify(mockEventBody)
    } as APIGatewayEvent
};

let getEtagFromHeadersSpy: jest.SpyInstance;
let generateResponseDataSpy: jest.SpyInstance;
let handleMergeConflictsSpy: jest.SpyInstance;
let getPersonalInformationSpy: jest.SpyInstance;

describe('put-affinidi-data.handler', () => {

    beforeEach(() => {
        getEtagFromHeadersSpy = jest.spyOn(etagUtils, 'getETagFromHeaders')
        generateResponseDataSpy = jest.spyOn(etagUtils, 'generateResponseData');
        handleMergeConflictsSpy = jest.spyOn(putAffinidiDataFns, 'handleMergeConflicts')
            .mockReturnValue(mockSuccessMergeConflictResult);
        getPersonalInformationSpy = jest.spyOn(personalInformationEntity, 'getPersonalInformation')
            .mockReturnValue(mockPersonalInformation);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('Returns a 401 status code if the did does not exist in the request context', async () => {
        const event = getEvent();
        event.requestContext.identity.user = null;
        const result = await putAffinidiDataFns.handler(event);
        expect(result.statusCode).toEqual(401);
    });


    it('Returns a 412 error code if tag is missing from header', async () => {
        getEtagFromHeadersSpy.mockReturnValue(undefined);
        const event = getEvent(mockEventBody, {});
        const result = await putAffinidiDataFns.handler(event);
        expect(result.statusCode).toEqual(412);
    });

    it('Returns a 200 code with a new Etag if merge and commit was successful', async () => {
        getEtagFromHeadersSpy.mockReturnValue(mockRequestETag);
        generateResponseDataSpy.mockReturnValueOnce(
            {
                body: mockPersonalInformation,
                headers: {
                    ETag: 'new-tag'
                }
            }
        );
        const event = getEvent();
        const result = await putAffinidiDataFns.handler(event);
        expect(result.statusCode).toEqual(200)
        expect(result.body).toEqual(mockPersonalInformation)
        expect((result.headers as any)['ETag']).toEqual('new-tag')
        expect(getPersonalInformationSpy).toHaveBeenCalledTimes(1);
        expect(handleMergeConflictsSpy).toHaveBeenCalledTimes(1);
        expect(generateResponseDataSpy).toHaveBeenCalledTimes(1);
    });
});
