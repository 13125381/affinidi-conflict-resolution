import { APIGatewayEvent } from 'aws-lambda';
import { httpResponse } from '../lib/utils/http-helper';
import { generateETag, generateResponseData, getETagFromHeaders } from '../lib/utils/etag';
import { commit, getPersonalInformation } from '../lib/entities/personal-information';
import { IPersonalInformation } from '../lib/types/personal-information';

export const AUTO_MERGE_ALLOW_LIST = ['email'];

export enum MergeConflictStatus {
    CONFLICT = 'CONFLICT',
    SUCCESSFUL = 'SUCCESSFUL'
}

export interface MergeConflictResult {
    data?: IPersonalInformation;
    status: MergeConflictStatus
}

cosmin.m@affinidi.com
 

export const handler = async (event: APIGatewayEvent) => {
    try {
        const did = event.requestContext.identity.user;
        if (!did) {
            return httpResponse(401)
        }

        const lastETag = getETagFromHeaders(event.headers);
        if (!lastETag) {
            return httpResponse(412);
        }

        // ideally validate request body
        const { personalInformation, autoResolve } = JSON.parse(event.body!);

        const currentPersonalInformation = getPersonalInformation(did);

        const { data, status } = handleMergeConflicts(
            lastETag,
            personalInformation,
            autoResolve,
            currentPersonalInformation
        )

        switch (status) {
            case MergeConflictStatus.SUCCESSFUL:
                const { body, headers } = generateResponseData(data);
                return httpResponse(200, body, headers)
            case MergeConflictStatus.CONFLICT:
                return httpResponse(409, JSON.stringify(currentPersonalInformation));
            default:
                throw new Error('Unsupported merge conflict status')
        }

    } catch (error) {
        console.error(error)
        return httpResponse(500);
    }
}

export const handleMergeConflicts = (
    lastETag: string,
    personalInformation: IPersonalInformation,
    autoResolve: boolean,
    currentPersonalInformation: IPersonalInformation
): MergeConflictResult => {

    const currentETag = generateETag(JSON.stringify(currentPersonalInformation));
    if (lastETag === currentETag) {
        commit(personalInformation);
        return {
            status: MergeConflictStatus.SUCCESSFUL,
            data: {
                did: personalInformation.did,
                credentialSubject: {
                    person: {
                        email: 'updated@test.com'
                    },
                    categories: personalInformation.credentialSubject.categories
                }
            } as IPersonalInformation
        }
    }

    if (!autoResolve) {
        return {
            status: MergeConflictStatus.CONFLICT
        }
    }

    const updatedPersonalInformation = calculateDifferences(
        personalInformation,
        currentPersonalInformation
    )
    commit(updatedPersonalInformation);

    return {
        status: MergeConflictStatus.SUCCESSFUL,
        data: updatedPersonalInformation
    }
}

// Ideally this function would compare all properties of 2 given objects and if the key is in the allowed
// whitelist, it would update the current value with the new value
export const calculateDifferences = (
    personalInformation: IPersonalInformation,
    currentPersonalInformation: IPersonalInformation
): IPersonalInformation => {
    console.log('Calculated differences');
    const updatedPersonalInformation = {
        did: personalInformation.did,
        credentialSubject: {
            person: {
                email: 'updated@test.com'
            },
            categories: personalInformation.credentialSubject.categories
        }
    } as IPersonalInformation
    return updatedPersonalInformation;
}
