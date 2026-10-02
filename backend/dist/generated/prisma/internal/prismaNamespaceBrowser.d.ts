import * as runtime from "@prisma/client/runtime/index-browser";
export type * from '../models.js';
export type * from './prismaNamespace.js';
export declare const Decimal: typeof runtime.Decimal;
export declare const NullTypes: {
    DbNull: (new (secret: never) => typeof runtime.DbNull);
    JsonNull: (new (secret: never) => typeof runtime.JsonNull);
    AnyNull: (new (secret: never) => typeof runtime.AnyNull);
};
/**
 * Helper for filtering JSON entries that have `null` on the database (empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const DbNull: import("@prisma/client-runtime-utils").DbNullClass;
/**
 * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const JsonNull: import("@prisma/client-runtime-utils").JsonNullClass;
/**
 * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
 */
export declare const AnyNull: import("@prisma/client-runtime-utils").AnyNullClass;
export declare const ModelName: {
    readonly User: 'User';
    readonly Employee: 'Employee';
    readonly Customer: 'Customer';
    readonly Product: 'Product';
    readonly InventoryTransaction: 'InventoryTransaction';
    readonly Order: 'Order';
    readonly OrderItem: 'OrderItem';
    readonly Invoice: 'Invoice';
    readonly Payment: 'Payment';
};
export type ModelName = (typeof ModelName)[keyof typeof ModelName];
export declare const TransactionIsolationLevel: {
    readonly ReadUncommitted: 'ReadUncommitted';
    readonly ReadCommitted: 'ReadCommitted';
    readonly RepeatableRead: 'RepeatableRead';
    readonly Serializable: 'Serializable';
};
export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];
export declare const UserScalarFieldEnum: {
    readonly id: 'id';
    readonly email: 'email';
    readonly password: 'password';
    readonly role: 'role';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum];
export declare const EmployeeScalarFieldEnum: {
    readonly id: 'id';
    readonly userId: 'userId';
    readonly firstName: 'firstName';
    readonly lastName: 'lastName';
    readonly email: 'email';
    readonly phone: 'phone';
    readonly department: 'department';
    readonly designation: 'designation';
    readonly joiningDate: 'joiningDate';
    readonly salary: 'salary';
    readonly status: 'status';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type EmployeeScalarFieldEnum = (typeof EmployeeScalarFieldEnum)[keyof typeof EmployeeScalarFieldEnum];
export declare const CustomerScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly companyName: 'companyName';
    readonly email: 'email';
    readonly phone: 'phone';
    readonly gstin: 'gstin';
    readonly address: 'address';
    readonly city: 'city';
    readonly creditLimit: 'creditLimit';
    readonly status: 'status';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type CustomerScalarFieldEnum = (typeof CustomerScalarFieldEnum)[keyof typeof CustomerScalarFieldEnum];
export declare const ProductScalarFieldEnum: {
    readonly id: 'id';
    readonly name: 'name';
    readonly sku: 'sku';
    readonly category: 'category';
    readonly brand: 'brand';
    readonly unit: 'unit';
    readonly purchasePrice: 'purchasePrice';
    readonly sellingPrice: 'sellingPrice';
    readonly currentStock: 'currentStock';
    readonly minimumStock: 'minimumStock';
    readonly status: 'status';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type ProductScalarFieldEnum = (typeof ProductScalarFieldEnum)[keyof typeof ProductScalarFieldEnum];
export declare const InventoryTransactionScalarFieldEnum: {
    readonly id: 'id';
    readonly productId: 'productId';
    readonly type: 'type';
    readonly quantity: 'quantity';
    readonly note: 'note';
    readonly createdAt: 'createdAt';
};
export type InventoryTransactionScalarFieldEnum = (typeof InventoryTransactionScalarFieldEnum)[keyof typeof InventoryTransactionScalarFieldEnum];
export declare const OrderScalarFieldEnum: {
    readonly id: 'id';
    readonly orderNumber: 'orderNumber';
    readonly customerId: 'customerId';
    readonly status: 'status';
    readonly subtotal: 'subtotal';
    readonly discount: 'discount';
    readonly total: 'total';
    readonly notes: 'notes';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type OrderScalarFieldEnum = (typeof OrderScalarFieldEnum)[keyof typeof OrderScalarFieldEnum];
export declare const OrderItemScalarFieldEnum: {
    readonly id: 'id';
    readonly orderId: 'orderId';
    readonly productId: 'productId';
    readonly quantity: 'quantity';
    readonly unitPrice: 'unitPrice';
    readonly total: 'total';
    readonly createdAt: 'createdAt';
};
export type OrderItemScalarFieldEnum = (typeof OrderItemScalarFieldEnum)[keyof typeof OrderItemScalarFieldEnum];
export declare const InvoiceScalarFieldEnum: {
    readonly id: 'id';
    readonly invoiceNumber: 'invoiceNumber';
    readonly customerId: 'customerId';
    readonly orderId: 'orderId';
    readonly subtotal: 'subtotal';
    readonly discount: 'discount';
    readonly tax: 'tax';
    readonly total: 'total';
    readonly status: 'status';
    readonly dueDate: 'dueDate';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum];
export declare const PaymentScalarFieldEnum: {
    readonly id: 'id';
    readonly paymentNumber: 'paymentNumber';
    readonly customerId: 'customerId';
    readonly invoiceId: 'invoiceId';
    readonly amount: 'amount';
    readonly paymentMethod: 'paymentMethod';
    readonly reference: 'reference';
    readonly notes: 'notes';
    readonly paymentDate: 'paymentDate';
    readonly createdAt: 'createdAt';
    readonly updatedAt: 'updatedAt';
};
export type PaymentScalarFieldEnum = (typeof PaymentScalarFieldEnum)[keyof typeof PaymentScalarFieldEnum];
export declare const SortOrder: {
    readonly asc: 'asc';
    readonly desc: 'desc';
};
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
export declare const QueryMode: {
    readonly default: 'default';
    readonly insensitive: 'insensitive';
};
export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode];
export declare const NullsOrder: {
    readonly first: 'first';
    readonly last: 'last';
};
export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];
//# sourceMappingURL=prismaNamespaceBrowser.d.ts.map