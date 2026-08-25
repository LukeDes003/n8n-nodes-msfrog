import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestOptions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

type MsfrogResource = 'workflow' | 'company' | 'user' | 'workflowEntry' | 'task';
type MsfrogOperation =
	| 'getTypes'
	| 'getAll'
	| 'get'
	| 'getSelf'
	| 'create'
	| 'update'
	| 'search'
	| 'fetchStep'
	| 'updateStep'
	| 'completeStep'
	| 'uncompleteStep'
	| 'createComment'
	| 'updateComment'
	| 'deleteComment'
	| 'deleteTask'
	| 'completeTask'
	| 'uncompleteTask';

export class Msfrog implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'MSFrog',
		name: 'msfrog',
		icon: { light: 'file:../../icons/msfrog.svg', dark: 'file:../../icons/msfrog.dark.svg' },
		group: ['transform'],
		version: [1],
		defaultVersion: 1,
		subtitle: '={{$parameter["resource"] + ": " + $parameter["operation"]}}',
		description: 'Access the MSFrog API',
		defaults: {
			name: 'MSFrog',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'msfrogApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Base URL',
				name: 'baseUrl',
				type: 'string',
				default: 'http://host.docker.internal:8000',
				placeholder: 'https://example.com',
				description: 'Base URL for the MSFrog API without a trailing slash',
			},
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				default: 'workflow',
				options: [
					{ name: 'Company', value: 'company' },
					{ name: 'Task', value: 'task' },
					{ name: 'User', value: 'user' },
					{ name: 'Workflow', value: 'workflow' },
					{ name: 'Workflow Entry', value: 'workflowEntry' },
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getTypes',
				displayOptions: {
					show: {
						resource: ['workflow'],
					},
				},
				options: [
					{
						name: 'Get List of Workflow Entry Types',
						value: 'getTypes',
						action: 'Get workflow entry types',
						description: 'List workflow definitions that can be used as workflow entry types',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many workflows',
						description: 'Get many workflows',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getAll',
				displayOptions: {
					show: {
						resource: ['company'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get many companies',
						description: 'Get many companies',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getSelf',
				displayOptions: {
					show: {
						resource: ['user'],
					},
				},
				options: [
					{
						name: 'Get Self',
						value: 'getSelf',
						action: 'Get current user details',
						description: 'Get the currently authenticated user',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'getAll',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
					},
				},
				options: [
					{
						name: 'Complete Step',
						value: 'completeStep',
						action: 'Complete a workflow entry step',
						description: 'Mark a workflow entry step complete',
					},
					{
						name: 'Create Comment',
						value: 'createComment',
						action: 'Create a workflow entry comment',
						description: 'Create a comment on a workflow entry',
					},
					{
						name: 'Create Workflow Entry',
						value: 'create',
						action: 'Create a workflow entry',
						description: 'Create a new entry for a workflow',
					},
					{
						name: 'Delete Comment',
						value: 'deleteComment',
						action: 'Delete a workflow entry comment',
						description: 'Delete a workflow entry comment',
					},
					{
						name: 'Fetch Step',
						value: 'fetchStep',
						action: 'Fetch a workflow entry step',
						description: 'Fetch a step from a workflow entry by entry UUID and step UUID',
					},
					{
						name: 'Get Workflow Entry',
						value: 'get',
						action: 'Get a workflow entry',
						description: 'Fetch a workflow entry by UUID',
					},
					{
						name: 'Get Many',
						value: 'getAll',
						action: 'Get workflow entries',
						description: 'List workflow entries for the current company or a selected company UUID',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search workflow entries',
						description: 'Search workflow entries in a workflow by keywords and return the best matches',
					},
					{
						name: 'Un-Complete Step',
						value: 'uncompleteStep',
						action: 'Un complete a workflow entry step',
						description: 'Reopen a workflow entry step',
					},
					{
						name: 'Update Comment',
						value: 'updateComment',
						action: 'Update a workflow entry comment',
						description: 'Update a workflow entry comment',
					},
					{
						name: 'Update Step',
						value: 'updateStep',
						action: 'Update a workflow entry step',
						description: 'Update a workflow entry step',
					},
					{
						name: 'Update Workflow Entry',
						value: 'update',
						action: 'Update a workflow entry',
						description: 'Update an existing workflow entry',
					},
				],
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				default: 'create',
				displayOptions: {
					show: {
						resource: ['task'],
					},
				},
				options: [
					{
						name: 'Complete Task',
						value: 'completeTask',
						action: 'Complete a task',
						description: 'Mark a task complete',
					},
					{
						name: 'Create Comment',
						value: 'createComment',
						action: 'Create a task comment',
						description: 'Create a comment on a task',
					},
					{
						name: 'Create New Task',
						value: 'create',
						action: 'Create a task',
						description: 'Create a new task',
					},
					{
						name: 'Delete Comment',
						value: 'deleteComment',
						action: 'Delete a task comment',
						description: 'Delete a task comment',
					},
					{
						name: 'Delete Task',
						value: 'deleteTask',
						action: 'Delete a task',
						description: 'Delete a task',
					},
					{
						name: 'Un-Complete Task',
						value: 'uncompleteTask',
						action: 'Un complete a task',
						description: 'Reopen a task',
					},
					{
						name: 'Update Comment',
						value: 'updateComment',
						action: 'Update a task comment',
						description: 'Update a task comment',
					},
					{
						name: 'Update Task',
						value: 'update',
						action: 'Update a task',
						description: 'Update an existing task',
					},
				],
			},
			{
				displayName: 'Workflow UUID',
				name: 'workflowUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'The workflow UUID to create an entry for or search within',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['create', 'search'],
					},
				},
			},
			{
				displayName: 'Keywords',
				name: 'keywords',
				type: 'json',
				default: '[]',
				description: 'JSON array of keywords or phrases to search for',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Search Limit',
				name: 'searchLimit',
				type: 'number',
				default: 10,
				typeOptions: {
					minValue: 1,
					maxValue: 100,
				},
				description: 'Maximum number of matching entries to return',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Include Entry Steps',
				name: 'includeEntrySteps',
				type: 'boolean',
				default: false,
				description: 'When enabled, search results include each entry step with UUID, assignee and due date',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['search'],
					},
				},
			},
			{
				displayName: 'Workflow Entry UUID',
				name: 'workflowEntryUuid',
				type: 'string',
				default: '',
				required: true,

				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['get', 'update', 'fetchStep', 'createComment', 'updateComment', 'deleteComment'],
					},
				},
			},
			{
				displayName: 'Entry Name',
				name: 'name',
				type: 'string',
				default: '',
				required: true,
				description: 'Name for the workflow entry',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Description',
				name: 'description',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 4,
				},
				description: 'Optional workflow entry description',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Step Assignments',
				name: 'stepAssignments',
				type: 'json',
				default: '[]',
				description: 'JSON array of step assignment objects using backend field names',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Meta (JSON)',
				name: 'meta',
				type: 'json',
				default: '{}',
				description: 'Optional hidden metadata to store with the entry (e.g. email_ids, thread_ids). Not visible in the frontend.',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Company UUID',
				name: 'companyUuid',
				type: 'string',
				default: '',
				placeholder: 'Optional company UUID',
				description: 'Optional company filter for workflow queries',
				displayOptions: {
					show: {
						resource: ['workflow', 'workflowEntry'],
						operation: ['getAll', 'getTypes'],
					},
				},
			},
			{
				displayName: 'Step UUID',
				name: 'stepUuid',
				type: 'string',
				default: '',
				required: true,
				description: 'The workflow entry step UUID',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['fetchStep', 'updateStep', 'completeStep', 'uncompleteStep'],
					},
				},
			},
			{
				displayName: 'Step Data',
				name: 'stepData',
				type: 'json',
				default: '{}',
				description: 'JSON payload for step updates, using backend field names',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['updateStep'],
					},
				},
			},
			{
				displayName: 'Comment',
				name: 'comment',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 4,
				},
				description: 'The comment text',
				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['createComment', 'updateComment'],
					},
				},
			},
			{
				displayName: 'Comment UUID',
				name: 'commentUuid',
				type: 'string',
				default: '',
				required: true,

				displayOptions: {
					show: {
						resource: ['workflowEntry'],
						operation: ['updateComment', 'deleteComment'],
					},
				},
			},
			{
				displayName: 'Task UUID',
				name: 'taskUuid',
				type: 'string',
				default: '',
				required: true,

				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['update', 'deleteTask', 'completeTask', 'uncompleteTask', 'createComment', 'updateComment', 'deleteComment'],
					},
				},
			},
			{
				displayName: 'Task Data',
				name: 'taskData',
				type: 'json',
				default: '{}',
				description: 'JSON payload for task create/update using backend field names',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['create', 'update'],
					},
				},
			},
			{
				displayName: 'Task Comment',
				name: 'taskComment',
				type: 'string',
				default: '',
				typeOptions: {
					rows: 4,
				},
				description: 'The task comment text',
				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['createComment', 'updateComment'],
					},
				},
			},
			{
				displayName: 'Task Comment UUID',
				name: 'taskCommentUuid',
				type: 'string',
				default: '',
				required: true,

				displayOptions: {
					show: {
						resource: ['task'],
						operation: ['updateComment', 'deleteComment'],
					},
				},
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: true,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						operation: ['getAll', 'getTypes'],
						resource: ['workflow', 'company', 'workflowEntry'],
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
					maxValue: 500,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						operation: ['getAll', 'getTypes'],
						resource: ['workflow', 'company', 'workflowEntry'],
						returnAll: [false],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const inputItems = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const parseJsonInput = <T>(value: unknown, fallback: T, itemIndex: number): T => {
			if (value === null || value === undefined || value === '') {
				return fallback;
			}

			if (typeof value === 'string') {
				try {
					return JSON.parse(value) as T;
				} catch {
					throw new NodeOperationError(this.getNode(), new Error('Invalid JSON input.'), {
						itemIndex,
					});
				}
			}

			return value as T;
		};

		const resolveMetaPayload = (value: unknown, fallback: unknown, itemIndex: number): IDataObject => {
			const parsed = parseJsonInput<IDataObject>(value, {}, itemIndex);
			const fallbackMeta = (fallback && typeof fallback === 'object' ? fallback : {}) as IDataObject;
			const normalizedMeta = {
				...(parsed && typeof parsed === 'object' ? parsed : {}),
			} as IDataObject;

			const currentEmailIds = Array.isArray(normalizedMeta.email_ids)
				? normalizedMeta.email_ids.filter((entry) => String(entry).trim() !== '')
				: [];
			const currentThreadIds = Array.isArray(normalizedMeta.thread_ids)
				? normalizedMeta.thread_ids.filter((entry) => String(entry).trim() !== '')
				: [];
			const fallbackEmailId = String(fallbackMeta.messageId ?? fallbackMeta.email_id ?? '').trim();
			const fallbackThreadId = String(fallbackMeta.threadId ?? fallbackMeta.thread_id ?? '').trim();
			const mergedEmailIds = Array.from(new Set([...currentEmailIds, ...(fallbackEmailId ? [fallbackEmailId] : [])].filter(Boolean)));
			const mergedThreadIds = Array.from(new Set([...currentThreadIds, ...(fallbackThreadId ? [fallbackThreadId] : [])].filter(Boolean)));

			if (mergedEmailIds.length > 0) {
				normalizedMeta.email_ids = mergedEmailIds;
			}
			if (mergedThreadIds.length > 0) {
				normalizedMeta.thread_ids = mergedThreadIds;
			}

			return normalizedMeta;
		};

		for (let itemIndex = 0; itemIndex < inputItems.length; itemIndex++) {
			const requestApi = async <T>(
				method: 'GET' | 'POST' | 'PUT' | 'DELETE',
				path: string,
				body?: IDataObject,
			): Promise<T> => {
				const baseUrl = this.getNodeParameter('baseUrl', itemIndex) as string;
				const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

				const options: IHttpRequestOptions = {
					method,
					url: `${normalizedBaseUrl}${path}`,
					json: true,
				};

				if (body !== undefined) {
					options.body = body;
				}

				try {
					return this.helpers.httpRequestWithAuthentication.call(this, 'msfrogApi', options) as Promise<T>;
				} catch (error) {
					const errorMessage = (error as Error)?.message ?? '';
					const errorObject = error as unknown as {
						message?: string;
						response?: { body?: unknown };
						body?: unknown;
					};
					const responseBody = errorObject.response?.body ?? errorObject.body ?? null;
					const responsePayload = typeof responseBody === 'string'
						? responseBody
						: responseBody && typeof responseBody === 'object'
							? JSON.stringify(responseBody)
							: '';
					if (!errorMessage.includes('Node does not have any credentials set')) {
						const detailedError = responsePayload && responsePayload !== '{}' && responsePayload !== 'null'
							? new Error(`${errorMessage}: ${responsePayload}`)
							: (error as Error);
						throw new NodeApiError(this.getNode(), { message: detailedError.message } as JsonObject, { itemIndex });
					}

					// Fallback for environments where helper lookup can fail despite a linked credential.
					const credentials = await this.getCredentials('msfrogApi');
					const credentialToken = String(credentials.accessToken ?? '');
					const credentialBaseUrlRaw = String(credentials.baseUrl ?? '').trim();
					const credentialBaseUrl = credentialBaseUrlRaw !== '' ? credentialBaseUrlRaw : normalizedBaseUrl;
					const normalizedCredentialBaseUrl = credentialBaseUrl.endsWith('/')
						? credentialBaseUrl.slice(0, -1)
						: credentialBaseUrl;

					const manualOptions: IHttpRequestOptions = {
						...options,
						url: `${normalizedCredentialBaseUrl}${path}`,
						headers: {
							...(options.headers ?? {}),
							Authorization: `Bearer ${credentialToken}`,
						},
					};

					return this.helpers.httpRequest.call(this, manualOptions) as Promise<T>;
				}
			};

			try {
				const resource = this.getNodeParameter('resource', itemIndex) as MsfrogResource;
				const operation = this.getNodeParameter('operation', itemIndex) as MsfrogOperation;

				if (resource === 'workflow' && (operation === 'getTypes' || operation === 'getAll')) {
					const companyUuid = this.getNodeParameter('companyUuid', itemIndex, '') as string;
					const returnAll = this.getNodeParameter('returnAll', itemIndex, true) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const path = companyUuid ? `/api/workflows/company/${companyUuid}` : '/api/workflows';
					const workflows = await requestApi<IDataObject[]>('GET', path);
					const workflowTypes = operation === 'getTypes'
						? workflows.filter((workflow) => {
							const status = String(workflow.status ?? '').toLowerCase();
							return status === '' || status === 'active';
						})
						: workflows;
					const selected = returnAll ? workflowTypes : workflowTypes.slice(0, limit);

					for (const workflow of selected) {
						returnData.push({ json: workflow, pairedItem: { item: itemIndex } });
					}

					continue;
				}

				if (resource === 'company' && operation === 'getAll') {
					const returnAll = this.getNodeParameter('returnAll', itemIndex, true) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const companies = await requestApi<IDataObject[]>('GET', '/api/company/getcompanysimpledetails');
					const selected = returnAll ? companies : companies.slice(0, limit);

					for (const company of selected) {
						returnData.push({ json: company, pairedItem: { item: itemIndex } });
					}

					continue;
				}

				if (resource === 'user' && operation === 'getSelf') {
					const user = await requestApi<IDataObject>('GET', '/api/user/self');
					returnData.push({ json: user, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'getAll') {
					const companyUuid = this.getNodeParameter('companyUuid', itemIndex, '') as string;
					const returnAll = this.getNodeParameter('returnAll', itemIndex, true) as boolean;
					const limit = this.getNodeParameter('limit', itemIndex, 50) as number;
					const path = companyUuid ? `/api/userworkflows/company/${companyUuid}` : '/api/userworkflows';
					const workflowEntries = await requestApi<IDataObject[]>('GET', path);
					const selected = returnAll ? workflowEntries : workflowEntries.slice(0, limit);

					for (const workflowEntry of selected) {
						returnData.push({ json: workflowEntry, pairedItem: { item: itemIndex } });
					}

					continue;
				}

				if (resource === 'workflowEntry' && operation === 'get') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const workflowEntry = await requestApi<IDataObject>('GET', `/api/userworkflows/${workflowEntryUuid}`);
					returnData.push({ json: workflowEntry, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'search') {
					const workflowUuid = this.getNodeParameter('workflowUuid', itemIndex) as string;
					const keywords = parseJsonInput<unknown[]>(this.getNodeParameter('keywords', itemIndex, '[]'), [], itemIndex);
					const searchLimit = this.getNodeParameter('searchLimit', itemIndex, 10) as number;
					const includeEntrySteps = this.getNodeParameter('includeEntrySteps', itemIndex, false) as boolean;
					const result = await requestApi<IDataObject>('POST', '/api/userworkflows/search', {
						workflow_uuid: workflowUuid,
						keywords,
						limit: searchLimit,
						include_entry_steps: includeEntrySteps,
					});

					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'create') {
					const workflowUuid = this.getNodeParameter('workflowUuid', itemIndex) as string;
					const name = this.getNodeParameter('name', itemIndex) as string;
					const description = this.getNodeParameter('description', itemIndex, '') as string;
					const stepAssignments = parseJsonInput<IDataObject[]>(this.getNodeParameter('stepAssignments', itemIndex, '[]'), [], itemIndex);
					const inputJson = inputItems[itemIndex]?.json as IDataObject;
					const fallbackMeta = (inputJson?.meta ?? inputJson?.workflowEntryMeta ?? inputJson?.emailMeta ?? {}) as IDataObject;
					const metaRaw = resolveMetaPayload(this.getNodeParameter('meta', itemIndex, '{}'), fallbackMeta, itemIndex);
					const body: IDataObject = {
						workflow_uuid: workflowUuid,
						name,
						description,
						step_assignments: stepAssignments,
					};
					if (metaRaw && Object.keys(metaRaw).length > 0) body.meta = metaRaw;
					const result = await requestApi<IDataObject>('POST', '/api/userworkflows', body);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'update') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const name = this.getNodeParameter('name', itemIndex) as string;
					const description = this.getNodeParameter('description', itemIndex, '') as string;
					const stepAssignments = parseJsonInput<IDataObject[]>(this.getNodeParameter('stepAssignments', itemIndex, '[]'), [], itemIndex);
					const inputJson = inputItems[itemIndex]?.json as IDataObject;
					const fallbackMeta = (inputJson?.meta ?? inputJson?.workflowEntryMeta ?? inputJson?.emailMeta ?? {}) as IDataObject;
					const metaRaw = resolveMetaPayload(this.getNodeParameter('meta', itemIndex, '{}'), fallbackMeta, itemIndex);
					const body: IDataObject = {
						name,
						description,
					};
					if (stepAssignments.length > 0) body.step_assignments = stepAssignments;
					if (metaRaw && Object.keys(metaRaw).length > 0) body.meta = metaRaw;
					const result = await requestApi<IDataObject>('PUT', `/api/userworkflows/${workflowEntryUuid}`, body);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'fetchStep') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const stepUuid = this.getNodeParameter('stepUuid', itemIndex) as string;
					const entry = await requestApi<IDataObject>('GET', `/api/userworkflows/${workflowEntryUuid}`);
					const steps = Array.isArray(entry.steps) ? (entry.steps as IDataObject[]) : [];
					const step = steps.find((currentStep) => currentStep.uuid === stepUuid);

					if (!step) {
						throw new NodeOperationError(this.getNode(), new Error(`Workflow entry step ${stepUuid} was not found.`), {
							itemIndex,
						});
					}

					returnData.push({ json: { entry_uuid: workflowEntryUuid, step }, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'updateStep') {
					const stepUuid = this.getNodeParameter('stepUuid', itemIndex) as string;
					const stepData = parseJsonInput<IDataObject>(this.getNodeParameter('stepData', itemIndex, '{}'), {}, itemIndex);
					const result = await requestApi<IDataObject>('PUT', `/api/userworkflows/steps/${stepUuid}`, stepData);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'completeStep') {
					const stepUuid = this.getNodeParameter('stepUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/userworkflows/steps/${stepUuid}/complete`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'uncompleteStep') {
					const stepUuid = this.getNodeParameter('stepUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/userworkflows/steps/${stepUuid}/reopen`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'createComment') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const comment = this.getNodeParameter('comment', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/userworkflows/${workflowEntryUuid}/comments`, { comment });
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'updateComment') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const commentUuid = this.getNodeParameter('commentUuid', itemIndex) as string;
					const comment = this.getNodeParameter('comment', itemIndex) as string;
					const result = await requestApi<IDataObject>('PUT', `/api/userworkflows/${workflowEntryUuid}/comments/${commentUuid}`, { comment });
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'workflowEntry' && operation === 'deleteComment') {
					const workflowEntryUuid = this.getNodeParameter('workflowEntryUuid', itemIndex) as string;
					const commentUuid = this.getNodeParameter('commentUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('DELETE', `/api/userworkflows/${workflowEntryUuid}/comments/${commentUuid}`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'create') {
					const taskData = parseJsonInput<IDataObject>(this.getNodeParameter('taskData', itemIndex, '{}'), {}, itemIndex);
					const result = await requestApi<IDataObject>('POST', '/api/tasks', taskData);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'update') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const taskData = parseJsonInput<IDataObject>(this.getNodeParameter('taskData', itemIndex, '{}'), {}, itemIndex);
					const result = await requestApi<IDataObject>('PUT', `/api/tasks/${taskUuid}`, taskData);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'deleteTask') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('DELETE', `/api/tasks/${taskUuid}`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'completeTask') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/tasks/complete/${taskUuid}`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'uncompleteTask') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/tasks/uncomplete/${taskUuid}`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'createComment') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const comment = this.getNodeParameter('taskComment', itemIndex) as string;
					const result = await requestApi<IDataObject>('POST', `/api/tasks/${taskUuid}/newcomment`, { comment });
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'updateComment') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const commentUuid = this.getNodeParameter('taskCommentUuid', itemIndex) as string;
					const comment = this.getNodeParameter('taskComment', itemIndex) as string;
					const result = await requestApi<IDataObject>('PUT', `/api/tasks/${taskUuid}/comment/${commentUuid}`, { comment });
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				if (resource === 'task' && operation === 'deleteComment') {
					const taskUuid = this.getNodeParameter('taskUuid', itemIndex) as string;
					const commentUuid = this.getNodeParameter('taskCommentUuid', itemIndex) as string;
					const result = await requestApi<IDataObject>('DELETE', `/api/tasks/${taskUuid}/comment/${commentUuid}`);
					returnData.push({ json: result, pairedItem: { item: itemIndex } });
					continue;
				}

				throw new NodeOperationError(this.getNode(), new Error(`Unsupported combination: ${resource}.${operation}`), {
					itemIndex,
				});
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: itemIndex },
					});
					continue;
				}

				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex });
			}
		}

		return [returnData];
	}
}
