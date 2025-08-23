export interface ColumnDef {
field: string; // The field associated with the data (must match a property in ProviderDto)
header: string; // The column header displayed in the table
sortable?: boolean; // Whether the column is sortable (optional, default: false)
width?: string; // Column width (e.g., '200px' or '10rem')
renderer?: (row: any) => string; // A function to customize the data display (e.g., date format)
}