import { APIGatewayRequestAuthorizerEvent } from 'aws-lambda';

const AUTH_HEADER_KEY = 'Authorization'
const AUTH_SECRET = 'qas'

enum AuthorizerAction {
    ALLOW = 'Allow',
    DENY = 'Deny'
}

export const handler = async (event: APIGatewayRequestAuthorizerEvent) => {
    try {
        if (event.headers) {
            const authHeaderValue = event.headers[AUTH_HEADER_KEY];
            if (!authHeaderValue) {
                return generatePolicyStatement(AuthorizerAction.DENY, event.methodArn);
            }

            const token = authHeaderValue.split(' ')[1];
            if(token && token === AUTH_SECRET) {
                return generatePolicyStatement(AuthorizerAction.ALLOW, event.methodArn);
            } 
        }

    } catch (error) {
        console.error(error)
        return generatePolicyStatement(AuthorizerAction.DENY, event.methodArn);
    }
}

const generatePolicyStatement = (authAction: AuthorizerAction, methodArn: string) => {
    return {
        principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: authAction,
                    Resource: methodArn,
                }
            ]
        }
    };
}