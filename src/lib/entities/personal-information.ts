import { IPersonalInformation } from '../types/personal-information';

export const getPersonalInformation = (did: string): IPersonalInformation => {
    return {
        did,
        credentialSubject: {
            person: {
                email: 'test@test.com'
            },
            categories: {
                fitness: {
                    fitnessGoals: ['Run faster'],
                    activities: [
                        {
                            activity: 'Running',
                            frequency: 'Daily'
                        }
                    ]
                }
            }
        }
    }
}

export const commit = (data: IPersonalInformation) => {
    console.log('Committing data')
}