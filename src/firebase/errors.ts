export type SecurityRuleContext = {
    path: string;
    operation: 'get' | 'list' | 'create' | 'update' | 'delete';
    requestResourceData?: any;
};
  
const FIRESTORE_PERMISSION_ERROR_NAME = 'FirestorePermissionError';

export class FirestorePermissionError extends Error {
    public readonly context: SecurityRuleContext;
    
    constructor(context: SecurityRuleContext) {
        const { path, operation } = context;
        const message = `Firestore permission denied for operation '${operation}' on path '${path}'`;
        
        super(message);
        this.name = FIRESTORE_PERMISSION_ERROR_NAME;
        this.context = context;
        
        // This is to make sure that the error is properly recognized in different JS environments
        Object.setPrototypeOf(this, FirestorePermissionError.prototype);
    }
}
