import type {
	IExecuteFunctions,
	IDataObject,
	IHttpRequestOptions,
	INodeProperties,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

type MsfrogResource = 'workflow' | 'company' | 'user' | 'workflowEntry' | 'task' | 'msmanual';
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
	| 'uncompleteTask'
	| 'callMsmanual'
	| `callMsmanual:${string}`;

type MsfrogHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

type MsmanualRouteDefinition = {
	name: string;
	value: string;
	method: MsfrogHttpMethod;
	path: string;
	hasBody?: boolean;
};

const MSMANUAL_ROUTE_DEFINITIONS: MsmanualRouteDefinition[] = [
	{ name: 'Get Company Info', value: 'getCompanyInfo', method: 'GET', path: '/companyinfo' },
	{ name: 'Get Org Chart', value: 'getOrgChart', method: 'GET', path: '/orgchart' },
	{ name: 'Get Product Services', value: 'getProdServ', method: 'GET', path: '/prodserv' },
	{ name: 'Get Design Development', value: 'getDesDev', method: 'GET', path: '/desdev' },
	{ name: 'Get Certification Scope', value: 'getCertScope', method: 'GET', path: '/certscope' },
	{ name: 'Get Key Processes', value: 'getKeyProcs', method: 'GET', path: '/keyprocs' },
	{ name: 'Get Interested Parties', value: 'getIntParts', method: 'GET', path: '/intparts' },
	{ name: 'Get USPS', value: 'getUSPs', method: 'GET', path: '/usps' },
	{ name: 'Get FQP', value: 'getFQP', method: 'GET', path: '/fqp' },
	{ name: 'Get Norm Refs', value: 'getNormRefs', method: 'GET', path: '/normrefs' },
	{ name: 'Get Norm Ref', value: 'getNormRef', method: 'GET', path: '/normrefs/{normRefId}' },
	{ name: 'Get Context Analysis', value: 'getContextAnalysis', method: 'GET', path: '/contextanalysis' },
	{ name: 'Get Risk Opportunity', value: 'getRiskOpportunityDetails', method: 'GET', path: '/riskopportunity/{type}' },
	{ name: 'Get Quality Objectives', value: 'getQObjectives', method: 'GET', path: '/qobjectives' },
	{ name: 'Get Customer Feedback', value: 'getCustFeedback', method: 'GET', path: '/custfeedback' },
	{ name: 'Get Used Customer Feedback Methods', value: 'getUsedCustomerFeedbackMethods', method: 'GET', path: '/custfeedback/usedmethods' },
	{ name: 'Get Customer Feedback Criteria', value: 'getCustFeedbackCriteria', method: 'GET', path: '/custfeedbackcriteria' },
	{ name: 'Get Supplier Types', value: 'getSupplierTypes', method: 'GET', path: '/suppliertypes' },
	{ name: 'Get Supplier Evaluation', value: 'getSupplierEvaluation', method: 'GET', path: '/suppev' },
	{ name: 'Get Used Supplier Types', value: 'getUsedSupplierTypes', method: 'GET', path: '/suppev/usedtypes' },
	{ name: 'Get Supplier Evaluation Criteria', value: 'getSupplierEvaluationCriteria', method: 'GET', path: '/suppevcriteria' },
	{ name: 'Get Terms Definitions', value: 'getTermsDefinitions', method: 'GET', path: '/termsdefinitions' },
	{ name: 'Get Hazard Identification', value: 'getHazardIdentification', method: 'GET', path: '/hazardidentification' },
	{ name: 'Get Elimination Hazard', value: 'getEliminationHazard', method: 'GET', path: '/eliminationhazard' },
	{ name: 'Get Multi Employer Work', value: 'getMultiEmployerWork', method: 'GET', path: '/multiemployerwork' },
	{ name: 'Get Workers Rep', value: 'getWorkersRep', method: 'GET', path: '/workersrep' },
	{ name: 'Get Assets', value: 'getAssets', method: 'GET', path: '/assets' },
	{ name: 'Get Annex A Controls', value: 'getAnnexAControls', method: 'GET', path: '/annexacontrols' },
	{ name: 'Get Communications', value: 'getCommunications', method: 'GET', path: '/communications' },
	{ name: 'Get FM', value: 'getFM', method: 'GET', path: '/fm' },
	{ name: 'Get FSOA', value: 'getFSOA', method: 'GET', path: '/fsoa' },
	{ name: 'Get Status', value: 'getStatus', method: 'GET', path: '/status' },
	{ name: 'Set Company Info', value: 'setCompanyInfo', method: 'POST', path: '/companyinfo', hasBody: true },
	{ name: 'Set Org Chart', value: 'setOrgChart', method: 'POST', path: '/orgchart', hasBody: true },
	{ name: 'Check Job Title', value: 'checkJobTitle', method: 'POST', path: '/checkjobtitle/{titleUuid}' },
	{ name: 'Set Product Service', value: 'setProdServ', method: 'POST', path: '/prodserv', hasBody: true },
	{ name: 'Complete Product Service', value: 'completeProdServ', method: 'POST', path: '/prodserv/markcomplete' },
	{ name: 'Incomplete Product Service', value: 'incompleteProdServ', method: 'POST', path: '/prodserv/markincomplete' },
	{ name: 'Delete Product Service', value: 'deleteProdServ', method: 'DELETE', path: '/prodserv/{mcprodservId}' },
	{ name: 'Delete All Product Services', value: 'deleteAllProdServ', method: 'DELETE', path: '/prodserv' },
	{ name: 'Set Design Development', value: 'setDesDev', method: 'POST', path: '/desdev', hasBody: true },
	{ name: 'Set Certification Scope', value: 'setCertScope', method: 'POST', path: '/certscope', hasBody: true },
	{ name: 'Set Key Processes', value: 'setKeyProcs', method: 'POST', path: '/keyprocs', hasBody: true },
	{ name: 'Set Interested Parties', value: 'setIntParts', method: 'POST', path: '/intparts', hasBody: true },
	{ name: 'Set USPS', value: 'setUSPs', method: 'POST', path: '/usps', hasBody: true },
	{ name: 'Complete FQP', value: 'completeFQP', method: 'POST', path: '/fqp/markcomplete' },
	{ name: 'Incomplete FQP', value: 'incompleteFQP', method: 'POST', path: '/fqp/markincomplete' },
	{ name: 'Create Norm Ref', value: 'createNormRef', method: 'POST', path: '/normref', hasBody: true },
	{ name: 'Complete Norm Ref', value: 'completeNormRef', method: 'POST', path: '/normref/markcomplete' },
	{ name: 'Incomplete Norm Ref', value: 'incompleteNormRef', method: 'POST', path: '/normref/markincomplete' },
	{ name: 'Update Norm Ref', value: 'updateNormRef', method: 'POST', path: '/normref/{normRefId}', hasBody: true },
	{ name: 'Delete Norm Ref', value: 'deleteNormRef', method: 'DELETE', path: '/normref/{normRefId}' },
	{ name: 'Set Context Analysis', value: 'setContextAnalysis', method: 'POST', path: '/contextanalysis', hasBody: true },
	{ name: 'Complete Context Analysis', value: 'completeContextAnalysis', method: 'POST', path: '/contextanalysis/markcomplete' },
	{ name: 'Incomplete Context Analysis', value: 'incompleteContextAnalysis', method: 'POST', path: '/contextanalysis/markincomplete' },
	{ name: 'Delete Context Analysis', value: 'deleteContextAnalysis', method: 'DELETE', path: '/contextanalysis/{riskoppsId}' },
	{ name: 'Complete Risk Opportunity Details', value: 'completeRiskOpportunityDetails', method: 'POST', path: '/riskopportunity/markascomplete/{type}' },
	{ name: 'Incomplete Risk Opportunity Details', value: 'incompleteRiskOpportunityDetails', method: 'POST', path: '/riskopportunity/markasincomplete/{type}' },
	{ name: 'Set Risk Appetite', value: 'setRiskAppetite', method: 'POST', path: '/riskopportunity/riskapetite', hasBody: true },
	{ name: 'Set Risk Opportunity', value: 'setRiskOpportunity', method: 'POST', path: '/riskopportunity/{riskoppId}', hasBody: true },
	{ name: 'Delete Risk Opportunity Action', value: 'deleteRiskOpportunityAction', method: 'DELETE', path: '/riskopportunity/{riskoppId}/action/{actionId}' },
	{ name: 'Set Quality Objectives', value: 'setQObjectives', method: 'POST', path: '/qobjectives', hasBody: true },
	{ name: 'Complete Quality Objectives', value: 'completeQObjectives', method: 'POST', path: '/qobjectives/markcomplete' },
	{ name: 'Incomplete Quality Objectives', value: 'incompleteQObjectives', method: 'POST', path: '/qobjectives/markincomplete' },
	{ name: 'Delete Quality Objective', value: 'deleteQObjective', method: 'DELETE', path: '/qobjectives/{qobjectivesId}' },
	{ name: 'Set Customer Feedback', value: 'setCustomerFeedback', method: 'POST', path: '/custfeedback', hasBody: true },
	{ name: 'Complete Customer Feedback', value: 'completeCustomerFeedback', method: 'POST', path: '/custfeedback/markcomplete' },
	{ name: 'Incomplete Customer Feedback', value: 'incompleteCustomerFeedback', method: 'POST', path: '/custfeedback/markincomplete' },
	{ name: 'Delete Customer Feedback', value: 'deleteCustomerFeedback', method: 'DELETE', path: '/custfeedback/{custfeedbackId}' },
	{ name: 'Set Customer Feedback Criteria', value: 'setCustomerFeedbackCriteria', method: 'POST', path: '/custfeedbackcriteria', hasBody: true },
	{ name: 'Complete Customer Feedback Criteria', value: 'completeCustomerFeedbackCriteria', method: 'POST', path: '/custfeedbackcriteria/markcomplete' },
	{ name: 'Incomplete Customer Feedback Criteria', value: 'incompleteCustomerFeedbackCriteria', method: 'POST', path: '/custfeedbackcriteria/markincomplete' },
	{ name: 'Delete Customer Feedback Criteria', value: 'deleteCustomerFeedbackCriteria', method: 'DELETE', path: '/custfeedbackcriteria/{custfeedbackcriteriaId}' },
	{ name: 'Set Supplier Types', value: 'setSupplierTypes', method: 'POST', path: '/suppliertypes', hasBody: true },
	{ name: 'Delete Supplier Type', value: 'deleteSupplierType', method: 'DELETE', path: '/suppliertypes/{sullpiertypeId}' },
	{ name: 'Set Supplier Evaluation', value: 'setSupplierEvaluation', method: 'POST', path: '/suppev', hasBody: true },
	{ name: 'Complete Supplier Evaluation', value: 'completeSupplierEvaluation', method: 'POST', path: '/suppev/markcomplete' },
	{ name: 'Incomplete Supplier Evaluation', value: 'incompleteSupplierEvaluation', method: 'POST', path: '/suppev/markincomplete' },
	{ name: 'Delete Supplier Evaluation', value: 'deleteSupplierEvaluation', method: 'DELETE', path: '/suppev/{suppevId}' },
	{ name: 'Set Supplier Evaluation Criteria', value: 'setSupplierEvaluationCriteria', method: 'POST', path: '/suppevcriteria', hasBody: true },
	{ name: 'Complete Supplier Evaluation Criteria', value: 'completeSupplierEvaluationCriteria', method: 'POST', path: '/suppevcriteria/markcomplete' },
	{ name: 'Incomplete Supplier Evaluation Criteria', value: 'incompleteSupplierEvaluationCriteria', method: 'POST', path: '/suppevcriteria/markincomplete' },
	{ name: 'Delete Supplier Evaluation Criteria', value: 'deleteSupplierEvaluationCriteria', method: 'DELETE', path: '/suppevcriteria/{suppevcriteriaId}' },
	{ name: 'Complete Terms Definitions', value: 'completeTermsDefinitions', method: 'PUT', path: '/termsdefinitions/complete' },
	{ name: 'Incomplete Terms Definitions', value: 'incompleteTermsDefinitions', method: 'PUT', path: '/termsdefinitions/incomplete' },
	{ name: 'Set Terms Definitions', value: 'setTermsDefinitions', method: 'POST', path: '/termsdefinitions', hasBody: true },
	{ name: 'Delete Terms Definitions', value: 'deleteTermsDefinitions', method: 'DELETE', path: '/termsdefinitions/{uuid}' },
	{ name: 'Complete Hazard Identification', value: 'completeHazardIdentification', method: 'PUT', path: '/hazardidentification/complete' },
	{ name: 'Incomplete Hazard Identification', value: 'incompleteHazardIdentification', method: 'PUT', path: '/hazardidentification/incomplete' },
	{ name: 'Set Hazard Identification', value: 'setHazardIdentification', method: 'POST', path: '/hazardidentification', hasBody: true },
	{ name: 'Set Hazard Identification Assignment', value: 'setHazardIdentificationAssignment', method: 'POST', path: '/hazardidentification/{assignUuid}', hasBody: true },
	{ name: 'Delete All Hazard Identification Assignments', value: 'deleteAllHazardIdentificationAssignments', method: 'DELETE', path: '/hazardidentification/all' },
	{ name: 'Delete Hazard Identification Assignment', value: 'deleteHazardIdentificationAssignment', method: 'DELETE', path: '/hazardidentification/{assignUuid}' },
	{ name: 'Set Hazard Identification Assignment Action', value: 'setHazardIdentificationAssignmentAction', method: 'POST', path: '/hazardidentification/{assignUuid}/action/{actionUuid}', hasBody: true },
	{ name: 'Delete Hazard Identification Assignment Action', value: 'deleteHazardIdentificationAssignmentAction', method: 'DELETE', path: '/hazardidentification/{assignUuid}/action/{actionUuid}' },
	{ name: 'Complete Elimination Hazard', value: 'completeEliminationHazard', method: 'PUT', path: '/eliminationhazard/complete' },
	{ name: 'Incomplete Elimination Hazard', value: 'incompleteEliminationHazard', method: 'PUT', path: '/eliminationhazard/incomplete' },
	{ name: 'Set Elimination Hazard', value: 'setEliminationHazard', method: 'POST', path: '/eliminationhazard', hasBody: true },
	{ name: 'Complete Multi Employer Work', value: 'completeMultiEmployerWork', method: 'PUT', path: '/multiemployerwork/complete' },
	{ name: 'Incomplete Multi Employer Work', value: 'incompleteMultiEmployerWork', method: 'PUT', path: '/multiemployerwork/incomplete' },
	{ name: 'Set Multi Employer Work', value: 'setMultiEmployerWork', method: 'POST', path: '/multiemployerwork', hasBody: true },
	{ name: 'Complete Workers Rep', value: 'completeWorkersRep', method: 'PUT', path: '/workersrep/complete' },
	{ name: 'Incomplete Workers Rep', value: 'incompleteWorkersRep', method: 'PUT', path: '/workersrep/incomplete' },
	{ name: 'Set Workers Rep', value: 'setWorkersRep', method: 'POST', path: '/workersrep', hasBody: true },
	{ name: 'Set Assets', value: 'setAssets', method: 'POST', path: '/assets', hasBody: true },
	{ name: 'Complete Annex A Controls', value: 'completeAnnexAControls', method: 'PUT', path: '/annexacontrols/complete' },
	{ name: 'Incomplete Annex A Controls', value: 'incompleteAnnexAControls', method: 'PUT', path: '/annexacontrols/incomplete' },
	{ name: 'Set Annex A Controls', value: 'setAnnexAControls', method: 'POST', path: '/annexacontrols', hasBody: true },
	{ name: 'Set Annex A Controls Assignment', value: 'setAnnexAControlsAssignment', method: 'POST', path: '/annexacontrols/{assignUuid}', hasBody: true },
	{ name: 'Delete All Annex A Controls Assignments', value: 'deleteAllAnnexAControlsAssignments', method: 'DELETE', path: '/annexacontrols/all' },
	{ name: 'Delete Annex A Controls Assignment', value: 'deleteAnnexAControlsAssignment', method: 'DELETE', path: '/annexacontrols/{assignUuid}' },
	{ name: 'Set Annex A Controls Assignment Action', value: 'setAnnexAControlsAssignmentAction', method: 'POST', path: '/annexacontrols/{assignUuid}/action/{actionUuid}', hasBody: true },
	{ name: 'Delete Annex A Controls Assignment Action', value: 'deleteAnnexAControlsAssignmentAction', method: 'DELETE', path: '/annexacontrols/{assignUuid}/action/{actionUuid}' },
	{ name: 'Complete Communications', value: 'completeCommunications', method: 'PUT', path: '/communications/complete' },
	{ name: 'Incomplete Communications', value: 'incompleteCommunications', method: 'PUT', path: '/communications/incomplete' },
	{ name: 'Set Communications', value: 'setCommunications', method: 'POST', path: '/communications', hasBody: true },
	{ name: 'Delete Communications', value: 'deleteCommunications', method: 'DELETE', path: '/communications/{uuid}' },
	{ name: 'Complete FM', value: 'completeFM', method: 'POST', path: '/fm/markcomplete' },
	{ name: 'Incomplete FM', value: 'incompleteFM', method: 'POST', path: '/fm/markincomplete' },
	{ name: 'Complete FSOA', value: 'completeFSOA', method: 'POST', path: '/fsoa/markcomplete' },
	{ name: 'Incomplete FSOA', value: 'incompleteFSOA', method: 'POST', path: '/fsoa/markincomplete' },
];

const MSMANUAL_ROUTE_MAP = Object.fromEntries(
	MSMANUAL_ROUTE_DEFINITIONS.map((route) => [route.value, route]),
) as Record<string, MsmanualRouteDefinition>;

const MSMANUAL_ROUTE_DISPLAY_ORDER = [
	'getCompanyInfo',
	'setCompanyInfo',
	'getOrgChart',
	'setOrgChart',
	'getProdServ',
	'setProdServ',
	'completeProdServ',
	'incompleteProdServ',
	'deleteProdServ',
	'deleteAllProdServ',
	'getDesDev',
	'setDesDev',
	'getCertScope',
	'setCertScope',
	'getKeyProcs',
	'setKeyProcs',
	'getIntParts',
	'setIntParts',
	'getUSPs',
	'setUSPs',
	'getFQP',
	'completeFQP',
	'incompleteFQP',
	'getNormRefs',
	'getNormRef',
	'createNormRef',
	'completeNormRef',
	'incompleteNormRef',
	'updateNormRef',
	'deleteNormRef',
	'getAssets',
	'setAssets',
	'getContextAnalysis',
	'setContextAnalysis',
	'completeContextAnalysis',
	'incompleteContextAnalysis',
	'deleteContextAnalysis',
	'getRiskOpportunityDetails',
	'completeRiskOpportunityDetails',
	'incompleteRiskOpportunityDetails',
	'setRiskAppetite',
	'setRiskOpportunity',
	'deleteRiskOpportunityAction',
	'getQObjectives',
	'setQObjectives',
	'completeQObjectives',
	'incompleteQObjectives',
	'deleteQObjective',
	'getCustFeedback',
	'getUsedCustomerFeedbackMethods',
	'setCustomerFeedback',
	'completeCustomerFeedback',
	'incompleteCustomerFeedback',
	'deleteCustomerFeedback',
	'getCustFeedbackCriteria',
	'setCustomerFeedbackCriteria',
	'completeCustomerFeedbackCriteria',
	'incompleteCustomerFeedbackCriteria',
	'deleteCustomerFeedbackCriteria',
	'getSupplierTypes',
	'setSupplierTypes',
	'deleteSupplierType',
	'getSupplierEvaluation',
	'getUsedSupplierTypes',
	'setSupplierEvaluation',
	'completeSupplierEvaluation',
	'incompleteSupplierEvaluation',
	'deleteSupplierEvaluation',
	'getSupplierEvaluationCriteria',
	'setSupplierEvaluationCriteria',
	'completeSupplierEvaluationCriteria',
	'incompleteSupplierEvaluationCriteria',
	'deleteSupplierEvaluationCriteria',
	'getTermsDefinitions',
	'setTermsDefinitions',
	'completeTermsDefinitions',
	'incompleteTermsDefinitions',
	'deleteTermsDefinitions',
	'getHazardIdentification',
	'setHazardIdentification',
	'completeHazardIdentification',
	'incompleteHazardIdentification',
	'deleteAllHazardIdentificationAssignments',
	'deleteHazardIdentificationAssignment',
	'setHazardIdentificationAssignment',
	'setHazardIdentificationAssignmentAction',
	'deleteHazardIdentificationAssignmentAction',
	'getEliminationHazard',
	'setEliminationHazard',
	'completeEliminationHazard',
	'incompleteEliminationHazard',
	'getMultiEmployerWork',
	'setMultiEmployerWork',
	'completeMultiEmployerWork',
	'incompleteMultiEmployerWork',
	'getWorkersRep',
	'setWorkersRep',
	'completeWorkersRep',
	'incompleteWorkersRep',
	'getAnnexAControls',
	'setAnnexAControls',
	'completeAnnexAControls',
	'incompleteAnnexAControls',
	'deleteAllAnnexAControlsAssignments',
	'deleteAnnexAControlsAssignment',
	'setAnnexAControlsAssignment',
	'setAnnexAControlsAssignmentAction',
	'deleteAnnexAControlsAssignmentAction',
	'getCommunications',
	'setCommunications',
	'completeCommunications',
	'incompleteCommunications',
	'deleteCommunications',
	'getFM',
	'completeFM',
	'incompleteFM',
	'getFSOA',
	'completeFSOA',
	'incompleteFSOA',
	'getStatus',
] as const;

const MSMANUAL_ROUTE_LAYOUT: Record<string, { section: string }> = {
	getCompanyInfo: { section: 'Company Information' },
	setCompanyInfo: { section: 'Company Information' },
	getOrgChart: { section: 'Organisation Chart' },
	setOrgChart: { section: 'Organisation Chart' },
	getProdServ: { section: 'Products & Services' },
	setProdServ: { section: 'Products & Services' },
	completeProdServ: { section: 'Products & Services' },
	incompleteProdServ: { section: 'Products & Services' },
	deleteProdServ: { section: 'Products & Services' },
	deleteAllProdServ: { section: 'Products & Services' },
	getDesDev: { section: 'Design & Development' },
	setDesDev: { section: 'Design & Development' },
	getCertScope: { section: 'Scope of Certification' },
	setCertScope: { section: 'Scope of Certification' },
	getKeyProcs: { section: 'Key Processes' },
	setKeyProcs: { section: 'Key Processes' },
	getIntParts: { section: 'Interested Parties' },
	setIntParts: { section: 'Interested Parties' },
	getUSPs: { section: 'USPs' },
	setUSPs: { section: 'USPs' },
	getFQP: { section: 'Finalise Policy' },
	completeFQP: { section: 'Finalise Policy' },
	incompleteFQP: { section: 'Finalise Policy' },
	getNormRefs: { section: 'Normative References' },
	getNormRef: { section: 'Normative References' },
	createNormRef: { section: 'Normative References' },
	completeNormRef: { section: 'Normative References' },
	incompleteNormRef: { section: 'Normative References' },
	updateNormRef: { section: 'Normative References' },
	deleteNormRef: { section: 'Normative References' },
	getAssets: { section: 'List of Assets' },
	setAssets: { section: 'List of Assets' },
	getContextAnalysis: { section: 'Context Analysis' },
	setContextAnalysis: { section: 'Context Analysis' },
	completeContextAnalysis: { section: 'Context Analysis' },
	incompleteContextAnalysis: { section: 'Context Analysis' },
	deleteContextAnalysis: { section: 'Context Analysis' },
	getRiskOpportunityDetails: { section: 'Risk Assessment' },
	completeRiskOpportunityDetails: { section: 'Risk Assessment' },
	incompleteRiskOpportunityDetails: { section: 'Risk Assessment' },
	setRiskAppetite: { section: 'Risk Assessment' },
	setRiskOpportunity: { section: 'Risk Assessment' },
	deleteRiskOpportunityAction: { section: 'Risk Assessment' },
	getQObjectives: { section: 'Objectives' },
	setQObjectives: { section: 'Objectives' },
	completeQObjectives: { section: 'Objectives' },
	incompleteQObjectives: { section: 'Objectives' },
	deleteQObjective: { section: 'Objectives' },
	getCustFeedback: { section: 'Customer Feedback' },
	getUsedCustomerFeedbackMethods: { section: 'Customer Feedback' },
	setCustomerFeedback: { section: 'Customer Feedback' },
	completeCustomerFeedback: { section: 'Customer Feedback' },
	incompleteCustomerFeedback: { section: 'Customer Feedback' },
	deleteCustomerFeedback: { section: 'Customer Feedback' },
	getCustFeedbackCriteria: { section: 'Customer Feedback Criteria' },
	setCustomerFeedbackCriteria: { section: 'Customer Feedback Criteria' },
	completeCustomerFeedbackCriteria: { section: 'Customer Feedback Criteria' },
	incompleteCustomerFeedbackCriteria: { section: 'Customer Feedback Criteria' },
	deleteCustomerFeedbackCriteria: { section: 'Customer Feedback Criteria' },
	getSupplierTypes: { section: 'Supplier Evaluation' },
	setSupplierTypes: { section: 'Supplier Evaluation' },
	deleteSupplierType: { section: 'Supplier Evaluation' },
	getSupplierEvaluation: { section: 'Supplier Evaluation' },
	getUsedSupplierTypes: { section: 'Supplier Evaluation' },
	setSupplierEvaluation: { section: 'Supplier Evaluation' },
	completeSupplierEvaluation: { section: 'Supplier Evaluation' },
	incompleteSupplierEvaluation: { section: 'Supplier Evaluation' },
	deleteSupplierEvaluation: { section: 'Supplier Evaluation' },
	getSupplierEvaluationCriteria: { section: 'Supplier Evaluation Criteria' },
	setSupplierEvaluationCriteria: { section: 'Supplier Evaluation Criteria' },
	completeSupplierEvaluationCriteria: { section: 'Supplier Evaluation Criteria' },
	incompleteSupplierEvaluationCriteria: { section: 'Supplier Evaluation Criteria' },
	deleteSupplierEvaluationCriteria: { section: 'Supplier Evaluation Criteria' },
	getTermsDefinitions: { section: 'Terms and Definitions' },
	setTermsDefinitions: { section: 'Terms and Definitions' },
	completeTermsDefinitions: { section: 'Terms and Definitions' },
	incompleteTermsDefinitions: { section: 'Terms and Definitions' },
	deleteTermsDefinitions: { section: 'Terms and Definitions' },
	getHazardIdentification: { section: 'Hazard Identification' },
	setHazardIdentification: { section: 'Hazard Identification' },
	completeHazardIdentification: { section: 'Hazard Identification' },
	incompleteHazardIdentification: { section: 'Hazard Identification' },
	deleteAllHazardIdentificationAssignments: { section: 'Hazard Identification' },
	deleteHazardIdentificationAssignment: { section: 'Hazard Identification' },
	setHazardIdentificationAssignment: { section: 'Hazard Identification' },
	setHazardIdentificationAssignmentAction: { section: 'Hazard Identification' },
	deleteHazardIdentificationAssignmentAction: { section: 'Hazard Identification' },
	getEliminationHazard: { section: 'Elimination of Hazards' },
	setEliminationHazard: { section: 'Elimination of Hazards' },
	completeEliminationHazard: { section: 'Elimination of Hazards' },
	incompleteEliminationHazard: { section: 'Elimination of Hazards' },
	getMultiEmployerWork: { section: 'Multi-employer workplace' },
	setMultiEmployerWork: { section: 'Multi-employer workplace' },
	completeMultiEmployerWork: { section: 'Multi-employer workplace' },
	incompleteMultiEmployerWork: { section: 'Multi-employer workplace' },
	getWorkersRep: { section: 'Workers Representative' },
	setWorkersRep: { section: 'Workers Representative' },
	completeWorkersRep: { section: 'Workers Representative' },
	incompleteWorkersRep: { section: 'Workers Representative' },
	getAnnexAControls: { section: 'Annex A Controls' },
	setAnnexAControls: { section: 'Annex A Controls' },
	completeAnnexAControls: { section: 'Annex A Controls' },
	incompleteAnnexAControls: { section: 'Annex A Controls' },
	deleteAllAnnexAControlsAssignments: { section: 'Annex A Controls' },
	deleteAnnexAControlsAssignment: { section: 'Annex A Controls' },
	setAnnexAControlsAssignment: { section: 'Annex A Controls' },
	setAnnexAControlsAssignmentAction: { section: 'Annex A Controls' },
	deleteAnnexAControlsAssignmentAction: { section: 'Annex A Controls' },
	getCommunications: { section: 'Communication' },
	setCommunications: { section: 'Communication' },
	completeCommunications: { section: 'Communication' },
	incompleteCommunications: { section: 'Communication' },
	deleteCommunications: { section: 'Communication' },
	getFM: { section: 'Finalise Manual' },
	completeFM: { section: 'Finalise Manual' },
	incompleteFM: { section: 'Finalise Manual' },
	getFSOA: { section: 'Finalise SOA' },
	completeFSOA: { section: 'Finalise SOA' },
	incompleteFSOA: { section: 'Finalise SOA' },
	getStatus: { section: 'Status' },
};

const buildMsmanualRouteLabel = (routeKey: string): string => {
	const route = MSMANUAL_ROUTE_MAP[routeKey];
	const layout = MSMANUAL_ROUTE_LAYOUT[routeKey];

	if (!route || !layout) {
		return routeKey;
	}

	return `${layout.section} > ${route.name}`;
};

const MSMANUAL_SECTION_ORDER = Array.from(
	new Set(MSMANUAL_ROUTE_DISPLAY_ORDER.map((routeKey) => MSMANUAL_ROUTE_LAYOUT[routeKey].section)),
);

const MSMANUAL_ROUTES_BY_SECTION = Object.fromEntries(
	MSMANUAL_SECTION_ORDER.map((section) => [
		section,
		MSMANUAL_ROUTE_DISPLAY_ORDER.filter((routeKey) => MSMANUAL_ROUTE_LAYOUT[routeKey].section === section).map((routeKey) => {
			const route = MSMANUAL_ROUTE_MAP[routeKey];
			return {
				name: route.name,
				value: route.value,
				action: `${route.method} ${route.path}`,
			};
		}),
	]),
) as Record<string, Array<{ name: string; value: string; action: string }>>;

const MSMANUAL_SECTION_OPERATION_OPTIONS = MSMANUAL_SECTION_ORDER.map((section) => ({
	name: `${section} Actions`,
	value: `callMsmanual:${section}`,
	action: `${section} actions`,
	description: `Select an action under ${section}`,
}));

const MSMANUAL_OPERATION_VALUES = [
	'callMsmanual',
	...MSMANUAL_SECTION_OPERATION_OPTIONS.map((option) => option.value),
];

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
					{ name: 'MS Manual', value: 'msmanual' },
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
				default: MSMANUAL_SECTION_OPERATION_OPTIONS[0]?.value ?? 'callMsmanual',
				displayOptions: {
					show: {
						resource: ['msmanual'],
					},
				},
				options: MSMANUAL_SECTION_OPERATION_OPTIONS,
			},
			...MSMANUAL_SECTION_ORDER.map((section): INodeProperties => ({
				displayName: 'Action',
				name: 'msmanualRoute',
				type: 'options',
				noDataExpression: true,
				default: MSMANUAL_ROUTES_BY_SECTION[section][0]?.value ?? '',
				displayOptions: {
					show: {
						resource: ['msmanual'],
						operation: [`callMsmanual:${section}`],
					},
				},
				options: MSMANUAL_ROUTES_BY_SECTION[section],
			})),
			{
				displayName: 'ISO Engagement ID',
				name: 'msmanualIsoEngagementId',
				type: 'string',
				default: '',
				required: true,
				description: 'ISO engagement ID used in /api/iso/{isoEngagementId}/msmanual/*',
				displayOptions: {
					show: {
						resource: ['msmanual'],
						operation: MSMANUAL_OPERATION_VALUES,
					},
				},
			},
			{
				displayName: 'Route Params (JSON)',
				name: 'msmanualRouteParams',
				type: 'json',
				default: '{}',
				description: 'JSON object for placeholders in the route path, e.g. {"normRefId":"123"}',
				displayOptions: {
					show: {
						resource: ['msmanual'],
						operation: MSMANUAL_OPERATION_VALUES,
					},
				},
			},
			{
				displayName: 'Body (JSON)',
				name: 'msmanualBody',
				type: 'json',
				default: '{}',
				description: 'Request body JSON. Used by routes that accept payloads; ignored for GET routes.',
				displayOptions: {
					show: {
						resource: ['msmanual'],
						operation: MSMANUAL_OPERATION_VALUES,
					},
				},
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
						name: 'Get Many',
						value: 'getAll',
						action: 'Get workflow entries',
						description: 'List workflow entries for the current company or a selected company UUID',
					},
					{
						name: 'Get Workflow Entry',
						value: 'get',
						action: 'Get a workflow entry',
						description: 'Fetch a workflow entry by UUID',
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
				description: 'Whether search results include each entry step with UUID, assignee and due date',
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

				if (resource === 'msmanual' && (operation === 'callMsmanual' || operation.startsWith('callMsmanual:'))) {
					const isoEngagementId = this.getNodeParameter('msmanualIsoEngagementId', itemIndex) as string;
					const msmanualRoute = this.getNodeParameter('msmanualRoute', itemIndex) as string;
					const routeParams = parseJsonInput<Record<string, unknown>>(
						this.getNodeParameter('msmanualRouteParams', itemIndex, '{}'),
						{},
						itemIndex,
					);
					const routeDefinition = MSMANUAL_ROUTE_MAP[msmanualRoute];

					if (!routeDefinition) {
						throw new NodeOperationError(this.getNode(), new Error(`Unsupported MS Manual route: ${msmanualRoute}`), {
							itemIndex,
						});
					}

					const routePath = routeDefinition.path.replace(/\{([^}]+)\}/g, (_match, token) => {
						const rawValue = routeParams[token];
						const value = rawValue === undefined || rawValue === null ? '' : String(rawValue).trim();

						if (value === '') {
							throw new NodeOperationError(
								this.getNode(),
								new Error(`Missing required route param '${token}' for route '${routeDefinition.path}'.`),
								{ itemIndex },
							);
						}

						return encodeURIComponent(value);
					});

					const fullPath = `/api/iso/${encodeURIComponent(String(isoEngagementId))}/msmanual${routePath}`;
					const requestBody = routeDefinition.hasBody
						? parseJsonInput<IDataObject>(this.getNodeParameter('msmanualBody', itemIndex, '{}'), {}, itemIndex)
						: undefined;
					const result = await requestApi<IDataObject>(routeDefinition.method, fullPath, requestBody);
					const requestMeta = {
						operation,
						routeValue: msmanualRoute,
						isoEngagementId,
						method: routeDefinition.method,
						path: fullPath,
						routeParams,
						body: requestBody ?? {},
						backendError: null,
					};
					const enrichedResult: IDataObject = {
						...requestMeta,
						...result,
						response: result?.response ?? result,
						backendError: result && typeof result === 'object' && ('error' in result || 'details' in result || 'err_code' in result)
							? {
									error: result.error ?? null,
									details: result.details ?? null,
									err_code: result.err_code ?? null,
								}
							: null,
					};
					returnData.push({ json: enrichedResult, pairedItem: { item: itemIndex } });
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
