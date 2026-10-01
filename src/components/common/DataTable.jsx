export default function DataTable({ columns = [], rows = [] }) {
	return <div className="table-shell overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead><tr>{columns.map(column => <th className="p-4 text-xs font-bold uppercase tracking-wide" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr className="border-t border-slate-100" key={row.id || index}>{columns.map(column => <td className="p-4" key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}</tbody></table></div>
}
