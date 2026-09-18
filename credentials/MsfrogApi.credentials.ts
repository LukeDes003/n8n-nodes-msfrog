import type {
	Icon,
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class MsfrogApi implements ICredentialType {
	name = 'msfrogApi';

	displayName = 'MSFrog API';

	documentationUrl = 'https://github.com/LukeDes003/n8n-nodes-msfrog#credentials';

	icon: Icon = { light: 'file:../icons/msfrog.svg', dark: 'file:../icons/msfrog.dark.svg' };

	properties: INodeProperties[] = [
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'http://host.docker.internal:8000',
			description: 'Base URL of the MSFrog API',
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description: 'Bearer token used for API requests',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials?.accessToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/user/self',
			method: 'GET',
		},
	};
}
