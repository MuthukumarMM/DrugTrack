export default function Button({ className = '', children, ...props }) {
	return <button className={`brand-button !px-4 !py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>
}
